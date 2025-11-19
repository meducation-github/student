import React, { useState, useEffect, useRef, useContext } from "react";
import {
  MessageCircle,
  X,
  Send,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  User,
  Users,
  CheckCheck,
  Check,
  ArrowLeft,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Mic,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../config/env";
import { InstituteContext, UserContext } from "../../context/contexts";
import MediaMessage from "./components/MediaMessage";
import FileUpload from "./components/FileUpload";
import mediaUploadService from "./services/mediaUploadService";
import { useChatPreferences } from "../../context/chatPreferencesContext";
import { Button } from "../../components/ui/button";

const Chat = () => {
  const { authState, studentData } = useContext(UserContext);
  const { instituteState } = useContext(InstituteContext);
  const [currentView, setCurrentView] = useState("conversations"); // 'conversations', 'chat', 'search'
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    id: studentData?.id,
    type: "student",
  });
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const { floatingEnabled, setFloatingEnabled } = useChatPreferences();
  const currentConversationRef = useRef(null);
  const currentViewRef = useRef(null);
  const lastReadTimestampsRef = useRef({});

  // Check if mobile on mount and resize
  useEffect(() => {
    console.log("studentData", studentData);
    if (studentData?.id) {
      setCurrentUser({
        id: studentData.id,
        type: "student",
      });
    }
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [currentUser.id, currentUser.type]);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [
    conversations,
    currentUser.id,
    currentUser.type,
    currentConversation,
    currentView,
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update refs when state changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
    currentViewRef.current = currentView;
  }, [currentConversation, currentView]);

  useEffect(() => {
    lastReadTimestampsRef.current = lastReadTimestamps;
  }, [lastReadTimestamps]);

  // Update last read timestamp when actively viewing a conversation
  useEffect(() => {
    if (currentConversation && currentView === "chat") {
      const updateLastRead = () => {
        const currentTime = new Date().toISOString();
        setLastReadTimestamps((prev) => ({
          ...prev,
          [currentConversation.id]: currentTime,
        }));
        setUnreadCounts((prev) => ({
          ...prev,
          [currentConversation.id]: 0,
        }));
      };

      // Update immediately when conversation is opened
      updateLastRead();

      // Set up interval to keep updating while conversation is open
      const interval = setInterval(updateLastRead, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentConversation, currentView]);

  // Ensure real-time subscription is properly set up when conversation changes
  useEffect(() => {
    if (
      currentConversation &&
      currentView === "chat" &&
      conversations.length > 0
    ) {
      // Force a small delay to ensure state is properly updated
      const timer = setTimeout(() => {
        // This will trigger the real-time subscription to re-establish with new context
        console.log(
          "Conversation changed, ensuring real-time subscription is active for:",
          currentConversation.id
        );
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentConversation?.id, currentView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    // Load conversations where current user is either participant1 or participant2
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .or(
        `participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`
      )
      .order("last_message_at", { ascending: false });

    if (!error && data) {
      const conversationsWithDetails = await Promise.all(
        data.map(async (conv) => {
          const otherParticipant =
            conv.participant1_id === currentUser.id &&
            conv.participant1_type === currentUser.type
              ? { id: conv.participant2_id, type: conv.participant2_type }
              : { id: conv.participant1_id, type: conv.participant1_type };

          const userInfo = await getUserInfo(
            otherParticipant.id,
            otherParticipant.type
          );
          return { ...conv, otherParticipant: userInfo };
        })
      );
      setConversations(conversationsWithDetails);

      // Load unread counts for all conversations
      await loadUnreadCounts(conversationsWithDetails);
    }
    setIsLoadingConversations(false);
  };

  const loadUnreadCounts = async (conversations) => {
    if (!conversations.length) return;

    const conversationIds = conversations.map((c) => c.id);

    // Count unread messages (messages after last read timestamp that aren't from current user)
    const counts = {};

    for (const conv of conversations) {
      const lastReadTime = lastReadTimestamps[conv.id] || conv.last_message_at;

      const { data, error } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("conversation_id", conv.id)
        .gt("created_at", lastReadTime)
        .neq("sender_id", currentUser.id)
        .neq("sender_type", currentUser.type)
        .eq("is_deleted", false);

      if (!error && data) {
        counts[conv.id] = data.length;
      }
    }

    setUnreadCounts(counts);
  };

  const getUserInfo = async (userId, userType) => {
    const table =
      userType === "staff"
        ? "staff"
        : userType === "student"
        ? "students"
        : "parents";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", userId);

    if (!error && data && data[0]) {
      const user = data[0];
      return {
        id: user.id,
        name:
          userType === "staff"
            ? user.name
            : `${user.first_name} ${user.last_name}`,
        email: user.email,
        profile: user.profile || null,
        type: userType,
      };
    }
    return null;
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];

    // Search based on current user type restrictions
    if (currentUser.type === "staff") {
      // Staff can chat with anyone
      const [staffData, studentData, parentData] = await Promise.all([
        supabase
          .from("staff")
          .select("*")
          .eq("institute_id", instituteState.id)
          .ilike("name", `%${query}%`),
        supabase
          .from("students")
          .select("*")
          .eq("institute_id", instituteState.id)
          .ilike("first_name", `%${query}%`),
        supabase
          .from("parents")
          .select("*")
          .eq("institute_id", instituteState.id)
          .ilike("first_name", `%${query}%`),
      ]);

      staffData.data?.forEach((user) =>
        results.push({
          ...user,
          displayName: user.name,
          type: "staff",
        })
      );

      studentData.data?.forEach((user) =>
        results.push({
          ...user,
          displayName: `${user.first_name} ${user.last_name}`,
          type: "student",
        })
      );

      parentData.data?.forEach((user) =>
        results.push({
          ...user,
          displayName: `${user.first_name} ${user.last_name}`,
          type: "parent",
        })
      );
    } else if (currentUser.type === "parent") {
      // Parents can chat with staff and students
      const [staffData, studentData] = await Promise.all([
        supabase
          .from("staff")
          .select("*")
          .eq("institute_id", instituteState.id)
          .ilike("name", `%${query}%`),
        supabase
          .from("students")
          .select("*")
          .eq("institute_id", instituteState.id)
          .ilike("first_name", `%${query}%`),
      ]);

      staffData.data?.forEach((user) =>
        results.push({
          ...user,
          displayName: user.name,
          type: "staff",
        })
      );

      studentData.data?.forEach((user) =>
        results.push({
          ...user,
          displayName: `${user.first_name} ${user.last_name}`,
          type: "student",
        })
      );
    } else if (currentUser.type === "student") {
      // Students can only chat with staff
      const { data } = await supabase
        .from("staff")
        .select("*")
        .eq("institute_id", instituteState.id)
        .ilike("name", `%${query}%`);

      data?.forEach((user) =>
        results.push({
          ...user,
          displayName: user.name,
          type: "staff",
        })
      );
    }

    setSearchResults(results.filter((user) => user.id !== currentUser.id));
  };

  // const startConversation = async (user) => {
  //   // Clear search query and results immediately
  //   setSearchQuery("");
  //   setSearchResults([]);

  //   // Check if conversation already exists
  //   const existingConv = conversations.find(
  //     (conv) =>
  //       conv.otherParticipant?.id === user.id &&
  //       conv.otherParticipant?.type === user.type
  //   );

  //   if (existingConv) {
  //     setCurrentConversation(existingConv);
  //     await loadMessages(existingConv.id);
  //     setCurrentView("chat");
  //     // Mark messages as read
  //     const currentTime = new Date().toISOString();
  //     setLastReadTimestamps((prev) => ({
  //       ...prev,
  //       [existingConv.id]: currentTime,
  //     }));
  //     setUnreadCounts((prev) => ({
  //       ...prev,
  //       [existingConv.id]: 0,
  //     }));
  //     return;
  //   }
  //   console.log("currentUser", currentUser);
  //   // Create new conversation
  //   const { data, error } = await supabase
  //     .from("chat_conversations")
  //     .insert({
  //       institute_id: INSTITUTE_ID,
  //       participant1_id: currentUser.id,
  //       participant1_type: currentUser.type,
  //       participant2_id: user.id,
  //       participant2_type: user.type,
  //     })
  //     .select()
  //     .single();
  //   console.log("data", data);
  //   // if (!error && data && data[0]) {
  //   const newConversation = {
  //     id: data.id,
  //     institute_id: INSTITUTE_ID,
  //     participant1_id: currentUser.id,
  //     participant1_type: currentUser.type,
  //     participant2_id: user.id,
  //     participant2_type: user.type,
  //     created_at: data.created_at,
  //     updated_at: data.updated_at,
  //   };
  //   setCurrentConversation(newConversation);
  //   setConversations((prev) => [newConversation, ...prev]);
  //   setCurrentView("chat");
  //   setMessages([]);
  //   // Mark new conversation as read
  //   const currentTime = new Date().toISOString();
  //   setLastReadTimestamps((prev) => ({
  //     ...prev,
  //     [newConversation.id]: currentTime,
  //   }));
  //   setUnreadCounts((prev) => ({
  //     ...prev,
  //     [newConversation.id]: 0,
  //   }));
  //   // } else {
  //   //   console.error("Error creating conversation:", error);
  //   // }
  // };

  const startConversation = async (user) => {
    // Clear search query and results immediately
    setSearchQuery("");
    setSearchResults([]);

    // Check if conversation already exists
    const existingConv = conversations.find(
      (conv) =>
        conv.otherParticipant?.id === user.id &&
        conv.otherParticipant?.type === user.type
    );

    if (existingConv) {
      setCurrentConversation(existingConv);
      await loadMessages(existingConv.id);
      setCurrentView("chat");

      // Mark messages as read
      markConversationAsRead(existingConv.id);
      return;
    }

    console.log("currentUser", currentUser);

    // Create new conversation in DB
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        institute_id: instituteState.id,
        participant1_id: currentUser.id,
        participant1_type: currentUser.type,
        participant2_id: user.id,
        participant2_type: user.type,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return;
    }

    // Determine other participant
    const otherParticipant =
      data.participant1_id === currentUser.id &&
      data.participant1_type === currentUser.type
        ? { id: data.participant2_id, type: data.participant2_type }
        : { id: data.participant1_id, type: data.participant1_type };

    // Fetch user info for other participant
    const userInfo = await getUserInfo(
      otherParticipant.id,
      otherParticipant.type
    );

    const newConversation = {
      ...data,
      otherParticipant: userInfo,
    };

    // Update state
    setCurrentConversation(newConversation);
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentView("chat");
    setMessages([]);

    // Mark new conversation as read
    markConversationAsRead(newConversation.id);
  };

  const loadMessages = async (conversationId) => {
    setIsLoadingMessages(true);
    setMessages([]); // Clear messages immediately to prevent showing previous conversation

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      // Mark messages as read when opening conversation
      const currentTime = new Date().toISOString();
      setLastReadTimestamps((prev) => ({
        ...prev,
        [conversationId]: currentTime,
      }));
      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: 0,
      }));
    }
    setIsLoadingMessages(false);
  };

  // Function to mark a conversation as read
  const markConversationAsRead = (conversationId) => {
    const currentTime = new Date().toISOString();
    setLastReadTimestamps((prev) => ({
      ...prev,
      [conversationId]: currentTime,
    }));
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: 0,
    }));
  };

  const sendMessage = async () => {
    if (
      (!newMessage.trim() && selectedFiles.length === 0) ||
      !currentConversation ||
      isSendingMessage ||
      isUploading
    )
      return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsSendingMessage(true);

    const tempId = `temp-${Date.now()}`;
    const currentTime = new Date().toISOString();

    // If there are files to upload, handle them first
    if (selectedFiles.length > 0) {
      await sendMediaMessage(messageText, selectedFiles);
      setSelectedFiles([]);
    } else {
      // Send text message only
      await sendTextMessage(messageText);
    }

    setIsSendingMessage(false);
  };

  const sendTextMessage = async (messageText) => {
    const tempId = `temp-${Date.now()}`;
    const currentTime = new Date().toISOString();

    const optimisticMessage = {
      id: tempId,
      conversation_id: currentConversation.id,
      sender_id: currentUser.id,
      sender_type: currentUser.type,
      message_text: messageText,
      message_type: "text",
      created_at: currentTime,
      is_deleted: false,
      is_edited: false,
      isOptimistic: true,
    };

    const messageData = {
      conversation_id: currentConversation.id,
      sender_id: currentUser.id,
      sender_type: currentUser.type,
      message_text: messageText,
      message_type: "text",
    };

    // Add optimistic message
    setMessages((prev) => [...prev, optimisticMessage]);

    // Update conversation's last message time immediately for better UX
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === currentConversation.id
          ? { ...conv, last_message_at: currentTime }
          : conv
      );
      // Sort conversations by last message time (most recent first)
      return updated.sort(
        (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)
      );
    });

    // Mark conversation as read when sending a message
    markConversationAsRead(currentConversation.id);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert(messageData)
        .select();

      if (!error && data && data[0]) {
        const realMessage = data[0];
        // Replace optimistic message by temp id
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...realMessage, isOptimistic: false } : msg
          )
        );
      } else {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(messageText);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText);
    }
  };

  const sendMediaMessage = async (messageText, files) => {
    setIsUploading(true);
    const currentTime = new Date().toISOString();

    try {
      // Upload all files
      const uploadPromises = files.map(async (file) => {
        const fileTypeCategory = mediaUploadService.getFileTypeCategory(file);

        if (fileTypeCategory === "video") {
          return await mediaUploadService.uploadVideoWithThumbnail(
            file,
            currentConversation.id
          );
        } else {
          return await mediaUploadService.uploadFile(
            file,
            currentConversation.id
          );
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const failedUploads = uploadResults.filter((result) => !result.success);

      if (failedUploads.length > 0) {
        alert(
          `Failed to upload ${failedUploads.length} file(s). Please try again.`
        );
        return;
      }

      // Group all media files into a single message
      const mediaFiles = uploadResults.map((result) => ({
        url: result.data.url,
        type: result.data.type,
        name: result.data.name,
        size: result.data.size,
        category: result.data.category,
        thumbnailUrl: result.data.thumbnailUrl,
      }));

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const messageType =
        files.length === 1 ? mediaFiles[0].category : "media_group";

      const optimisticMessage = {
        id: tempId,
        conversation_id: currentConversation.id,
        sender_id: currentUser.id,
        sender_type: currentUser.type,
        message_text:
          messageText ||
          (files.length === 1 ? mediaFiles[0].name : `${files.length} files`),
        message_type: messageType,
        media_url: files.length === 1 ? mediaFiles[0].url : null,
        media_type: files.length === 1 ? mediaFiles[0].type : null,
        media_name: files.length === 1 ? mediaFiles[0].name : null,
        media_size: files.length === 1 ? mediaFiles[0].size : null,
        thumbnail_url: files.length === 1 ? mediaFiles[0].thumbnailUrl : null,
        metadata: files.length > 1 ? { mediaFiles } : {},
        created_at: currentTime,
        is_deleted: false,
        is_edited: false,
        isOptimistic: true,
      };

      const messageData = {
        conversation_id: currentConversation.id,
        sender_id: currentUser.id,
        sender_type: currentUser.type,
        message_text:
          messageText ||
          (files.length === 1 ? mediaFiles[0].name : `${files.length} files`),
        message_type: messageType,
        media_url: files.length === 1 ? mediaFiles[0].url : null,
        media_type: files.length === 1 ? mediaFiles[0].type : null,
        media_name: files.length === 1 ? mediaFiles[0].name : null,
        media_size: files.length === 1 ? mediaFiles[0].size : null,
        thumbnail_url: files.length === 1 ? mediaFiles[0].thumbnailUrl : null,
        metadata: files.length > 1 ? { mediaFiles } : {},
      };

      // Add optimistic message
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .insert(messageData)
          .select();

        if (!error && data && data[0]) {
          const realMessage = data[0];
          // Replace optimistic message by temp id
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId ? { ...realMessage, isOptimistic: false } : msg
            )
          );
        } else {
          // Remove optimistic message on failure
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        }
      } catch (err) {
        console.error("Error sending media message:", err);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }

      // Update conversation's last message time
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === currentConversation.id
            ? { ...conv, last_message_at: currentTime }
            : conv
        );
        return updated.sort(
          (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)
        );
      });

      // Mark conversation as read when sending a message
      markConversationAsRead(currentConversation.id);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (files) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    if (index === "all") {
      setSelectedFiles([]);
    } else {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const editMessage = async (messageId, newText) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .update({
        message_text: newText,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (!error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, message_text: newText, is_edited: true }
            : m
        )
      );
      setEditingMessage(null);
    }
  };

  const deleteMessage = async (messageId) => {
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_deleted: true })
      .eq("id", messageId);

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const deleteConversation = async (conversationId) => {
    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId);

    if (!error) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentView("conversations");
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  };

  const setupRealtimeSubscription = () => {
    console.log(
      "Setting up real-time subscription for user:",
      currentUser.id,
      currentUser.type
    );

    const channel = supabase
      .channel(`chat-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          console.log("New message received:", payload);

          // If it's not our own message
          if (
            payload.new?.sender_id !== currentUser.id ||
            payload.new?.sender_type !== currentUser.type
          ) {
            // Check if this message belongs to one of our conversations
            const isOurConversation = conversations.some(
              (conv) => conv.id === payload.new.conversation_id
            );

            if (isOurConversation) {
              // Use refs to get the latest state values
              const currentConv = currentConversationRef.current;
              const currentViewState = currentViewRef.current;
              const currentLastReadTimes = lastReadTimestampsRef.current;

              // Only add message to current messages if we're viewing THIS specific conversation
              if (
                currentConv &&
                payload.new?.conversation_id === currentConv.id &&
                currentViewState === "chat"
              ) {
                setMessages((prev) => [...prev, payload.new]);
                // Mark conversation as read immediately when receiving a message while viewing it
                markConversationAsRead(payload.new.conversation_id);
              }

              // Update unread count for this conversation
              // Only show unread if conversation is not currently open
              const isCurrentlyViewing =
                currentConv &&
                currentConv.id === payload.new.conversation_id &&
                currentViewState === "chat";

              if (!isCurrentlyViewing) {
                const lastReadTime =
                  currentLastReadTimes[payload.new.conversation_id];
                if (!lastReadTime || payload.new.created_at > lastReadTime) {
                  setUnreadCounts((prev) => ({
                    ...prev,
                    [payload.new.conversation_id]:
                      (prev[payload.new.conversation_id] || 0) + 1,
                  }));
                }
              }

              // Update the specific conversation's last message time
              setConversations((prev) => {
                const updated = prev.map((conv) =>
                  conv.id === payload.new.conversation_id
                    ? { ...conv, last_message_at: payload.new.created_at }
                    : conv
                );
                // Sort conversations by last message time (most recent first)
                return updated.sort(
                  (a, b) =>
                    new Date(b.last_message_at) - new Date(a.last_message_at)
                );
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        (payload) => {
          console.log("Conversation update:", payload);
          // Only reload conversations if it's a structural change (not just message updates)
          if (
            payload.eventType === "DELETE" ||
            payload.eventType === "INSERT"
          ) {
            loadConversations();
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversationsList = () => (
    <motion.div
      className="h-full flex flex-col bg-white"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="bg-[#00a884] p-4 text-white rounded-tl-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Chats</h3>
          <button
            onClick={() => {
              // Mark current conversation as read when navigating away
              if (currentConversation) {
                markConversationAsRead(currentConversation.id);
              }
              setCurrentView("search");
            }}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <Users size={20} />
          </button>
        </div>
        <div className="relative mt-3">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70"
            size={16}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={conversationSearchQuery}
            onChange={(e) => setConversationSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/20 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884] mb-4"></div>
            <p className="text-sm">Loading conversations...</p>
          </div>
        ) : (
          (() => {
            const filteredConversations = conversations.filter((conv) =>
              conversationSearchQuery
                ? conv.otherParticipant?.name
                    ?.toLowerCase()
                    .includes(conversationSearchQuery.toLowerCase()) ||
                  conv.otherParticipant?.email
                    ?.toLowerCase()
                    .includes(conversationSearchQuery.toLowerCase())
                : true
            );

            if (filteredConversations.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <MessageCircle size={64} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">
                    {conversationSearchQuery
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                  <p className="text-sm text-center">
                    {conversationSearchQuery
                      ? "Try a different search term"
                      : "Start a new chat to get started"}
                  </p>
                </div>
              );
            }

            return filteredConversations.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => {
                  // If we're switching from another conversation, mark it as read first
                  if (
                    currentConversation &&
                    currentConversation.id !== conv.id
                  ) {
                    markConversationAsRead(currentConversation.id);
                  }

                  setCurrentConversation(conv);
                  loadMessages(conv.id);
                  setCurrentView("chat");
                  // Mark messages as read
                  markConversationAsRead(conv.id);
                }}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  currentConversation?.id === conv.id && !isMobile
                    ? "bg-blue-50 border-l-4 border-l-[#00a884]"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {conv.otherParticipant?.name?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </div>
                    {unreadCounts[conv.id] > 0 && (
                      <motion.div
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        {unreadCounts[conv.id] > 9
                          ? "9+"
                          : unreadCounts[conv.id]}
                      </motion.div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-medium truncate ${
                          unreadCounts[conv.id] > 0 ||
                          (currentConversation?.id === conv.id && !isMobile)
                            ? "text-gray-900 font-semibold"
                            : "text-gray-900"
                        }`}
                      >
                        {conv.otherParticipant?.name || "Unknown User"}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 capitalize">
                      {conv.otherParticipant?.type || "User"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this conversation?")) {
                        deleteConversation(conv.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ));
          })()
        )}
      </div>
    </motion.div>
  );

  const renderSearchView = () => (
    <motion.div
      className="h-full flex flex-col bg-white"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="bg-[#00a884] p-4 text-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              // Mark current conversation as read when navigating away
              if (currentConversation) {
                markConversationAsRead(currentConversation.id);
              }
              setCurrentView("conversations");
            }}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold">New Chat</h3>
        </div>
        <div className="relative mt-3">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white/20 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchResults.map((user, index) => (
          <motion.div
            key={`${user.type}-${user.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => startConversation(user)}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                {user.displayName?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {user.displayName}
                </h4>
                <p className="text-xs text-gray-500">{user.email}</p>
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full capitalize mt-1">
                  {user.type}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        {searchQuery && searchResults.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <User size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No users found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderChatView = () => (
    <motion.div
      className="h-full flex flex-col bg-[#efeae2]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Chat Header */}
      <div className="bg-[#00a884] p-4 text-white rounded-tr-lg">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button
              onClick={() => {
                // Mark current conversation as read when navigating away
                if (currentConversation) {
                  markConversationAsRead(currentConversation.id);
                }
                setCurrentView("conversations");
              }}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
            {currentConversation?.otherParticipant?.name
              ?.charAt(0)
              ?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">
              {currentConversation?.otherParticipant?.name || "Unknown User"}
            </h4>
            <p className="text-xs opacity-80 capitalize">
              {currentConversation?.otherParticipant?.type || "User"}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
              <Video size={18} />
            </button>
            <button className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
              <Phone size={18} />
            </button>
            <button className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
              <Info size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#efeae2]"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(Array.from(e.dataTransfer.files));
          }
        }}
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage =
              message.sender_id === currentUser.id &&
              message.sender_type === currentUser.type;

            // Group messages by date
            const messageDate = formatDate(message.created_at);
            const showDate =
              index === 0 ||
              formatDate(messages[index - 1]?.created_at) !== messageDate;

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white/80 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {messageDate}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                      isOwnMessage
                        ? "bg-[#dcf8c6] text-gray-800"
                        : "bg-white text-gray-800 shadow-sm"
                    } ${message.isOptimistic ? "opacity-75" : ""}`}
                  >
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          defaultValue={message.message_text}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              editMessage(message.id, e.target.value);
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border rounded text-gray-800"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingMessage(null)}
                            className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.message_type === "text" ? (
                          <p className="text-sm">{message.message_text}</p>
                        ) : (
                          <MediaMessage
                            message={message}
                            isOwnMessage={isOwnMessage}
                          />
                        )}
                        {message.is_edited && (
                          <span className="text-xs text-gray-500">
                            (edited)
                          </span>
                        )}
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwnMessage && !message.isOptimistic && (
                            <CheckCheck size={14} className="text-blue-500" />
                          )}
                          {isOwnMessage && message.isOptimistic && (
                            <Check size={14} className="text-gray-400" />
                          )}
                        </div>
                        {isOwnMessage && !message.isOptimistic && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                setShowMessageOptions(
                                  showMessageOptions === message.id
                                    ? null
                                    : message.id
                                )
                              }
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical size={12} />
                            </button>
                            {showMessageOptions === message.id && (
                              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                                <button
                                  onClick={() => {
                                    setEditingMessage(message.id);
                                    setShowMessageOptions(null);
                                  }}
                                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Edit3 size={14} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Delete this message?")) {
                                      deleteMessage(message.id);
                                    }
                                    setShowMessageOptions(null);
                                  }}
                                  className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Smile size={20} />
          </button>
          <FileUpload
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            selectedFiles={selectedFiles}
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message"
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={
              (!newMessage.trim() && selectedFiles.length === 0) || isUploading
            }
            className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#008f72] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Mobile view - single column
  if (isMobile) {
    return (
      <div className="h-screen bg-white">
        <AnimatePresence mode="wait">
          {currentView === "conversations" && (
            <motion.div
              key="conversations"
              className="h-full"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              {renderConversationsList()}
            </motion.div>
          )}

          {currentView === "search" && (
            <motion.div
              key="search"
              className="h-full"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              {renderSearchView()}
            </motion.div>
          )}

          {currentView === "chat" && (
            <motion.div
              key="chat"
              className="h-full"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              {renderChatView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop view - two columns
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Floating chat popup
          </p>
          <p className="text-xs text-muted-foreground">
            {floatingEnabled
              ? "Enabled — the chat bubble stays available on every page."
              : "Disabled — turn it on to reply without leaving other modules."}
          </p>
        </div>
        <Button
          variant={floatingEnabled ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFloatingEnabled((prev) => !prev)}
        >
          {floatingEnabled ? "Disable popup" : "Enable popup"}
        </Button>
      </div>
      <div className="h-[calc(100vh-50px)] bg-white flex rounded-lg">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 border-r border-gray-200 rounded-lg">
          <AnimatePresence mode="wait">
            {(currentView === "conversations" || currentView === "chat") && (
              <motion.div
                key="conversations"
                className="h-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderConversationsList()}
              </motion.div>
            )}

            {currentView === "search" && (
              <motion.div
                key="search"
                className="h-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderSearchView()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 rounded-lg">
          {currentView === "chat" && currentConversation ? (
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderChatView()}
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center bg-[#efeae2]">
              <div className="text-center text-gray-500">
                <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Welcome to Chat</p>
                <p className="text-sm">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
