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
} from "lucide-react";
import { supabase } from "../../config/env";
import { UserContext } from "../../context/contexts";

const Chat = () => {
  const { authState } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState("conversations"); // 'conversations', 'chat', 'search'
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentUser] = useState({
    id: "736dd05d-ec52-4cf2-ab47-772e1b98f99f",
    type: "student",
  }); // This should come from auth
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState({});

  const messagesEndRef = useRef(null);
  const INSTITUTE_ID = "550e8400-e29b-41d4-a716-446655440000";

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, currentUser.id, currentUser.type]);

  useEffect(() => {
    if (isOpen && conversations.length > 0) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [isOpen, conversations, currentUser.id, currentUser.type]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
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
          .eq("institute_id", INSTITUTE_ID)
          .ilike("name", `%${query}%`),
        supabase
          .from("students")
          .select("*")
          .eq("institute_id", INSTITUTE_ID)
          .ilike("first_name", `%${query}%`),
        supabase
          .from("parents")
          .select("*")
          .eq("institute_id", INSTITUTE_ID)
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
          .eq("institute_id", INSTITUTE_ID)
          .ilike("name", `%${query}%`),
        supabase
          .from("students")
          .select("*")
          .eq("institute_id", INSTITUTE_ID)
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
        .eq("institute_id", INSTITUTE_ID)
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
      const currentTime = new Date().toISOString();
      setLastReadTimestamps((prev) => ({
        ...prev,
        [existingConv.id]: currentTime,
      }));
      setUnreadCounts((prev) => ({
        ...prev,
        [existingConv.id]: 0,
      }));
      return;
    }

    // Create new conversation
    const { data, error } = await supabase.from("chat_conversations").insert({
      institute_id: INSTITUTE_ID,
      participant1_id: currentUser.id,
      participant1_type: currentUser.type,
      participant2_id: user.id,
      participant2_type: user.type,
    });

    if (!error && data && data[0]) {
      const newConversation = {
        ...data[0],
        otherParticipant: {
          id: user.id,
          name: user.displayName,
          email: user.email,
          type: user.type,
          profile: user.profile,
        },
      };
      setCurrentConversation(newConversation);
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentView("chat");
      setMessages([]);
      // Mark new conversation as read
      const currentTime = new Date().toISOString();
      setLastReadTimestamps((prev) => ({
        ...prev,
        [newConversation.id]: currentTime,
      }));
      setUnreadCounts((prev) => ({
        ...prev,
        [newConversation.id]: 0,
      }));
    }
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

  // const sendMessage = async () => {
  //   if (!newMessage.trim() || !currentConversation || isSendingMessage) return;

  //   const messageText = newMessage.trim();
  //   setNewMessage(""); // Clear input immediately for better UX
  //   setIsSendingMessage(true);

  //   // Create optimistic message for immediate display
  //   const optimisticMessage = {
  //     id: `temp-${Date.now()}`,
  //     conversation_id: currentConversation.id,
  //     sender_id: currentUser.id,
  //     sender_type: currentUser.type,
  //     message_text: messageText,
  //     created_at: new Date().toISOString(),
  //     is_deleted: false,
  //     is_edited: false,
  //     isOptimistic: true, // Flag to identify optimistic messages
  //   };
  //   console.log("optimisticMessage", optimisticMessage);
  //   // Add optimistic message immediately
  //   setMessages((prev) => [...prev, optimisticMessage]);
  //   console.log("messages", messages);
  //   const messageData = {
  //     conversation_id: currentConversation.id,
  //     sender_id: currentUser.id,
  //     sender_type: currentUser.type,
  //     message_text: messageText,
  //   };

  //   try {
  //     const { data, error } = await supabase
  //       .from("chat_messages")
  //       .insert(messageData);

  //     if (!error && data && data[0]) {
  //       // Replace optimistic message with real message
  //       setMessages((prev) =>
  //         prev.map((msg) =>
  //           msg.isOptimistic && msg.message_text === messageText
  //             ? { ...data[0], isOptimistic: false }
  //             : msg
  //         )
  //       );
  //     } else {
  //       // Remove optimistic message if API call failed
  //       setMessages((prev) => prev.filter((msg) => !msg.isOptimistic));
  //       // Restore the message text if sending failed
  //       setNewMessage(messageText);
  //     }
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     // Remove optimistic message if API call failed
  //     setMessages((prev) => prev.filter((msg) => !msg.isOptimistic));
  //     // Restore the message text if sending failed
  //     setNewMessage(messageText);
  //   } finally {
  //     setIsSendingMessage(false);
  //   }
  // };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || isSendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsSendingMessage(true);

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      id: tempId,
      conversation_id: currentConversation.id,
      sender_id: currentUser.id,
      sender_type: currentUser.type,
      message_text: messageText,
      created_at: new Date().toISOString(),
      is_deleted: false,
      is_edited: false,
      isOptimistic: true,
    };

    //   console.log("optimisticMessage", optimisticMessage);
    //   // Add optimistic message immediately
    //   setMessages((prev) => [...prev, optimisticMessage]);
    //   console.log("messages", messages);

    const messageData = {
      conversation_id: currentConversation.id,
      sender_id: currentUser.id,
      sender_type: currentUser.type,
      message_text: messageText,
    };

    // Add optimistic message
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert(messageData)
        .select(); // Make sure to select inserted row

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
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
              // If we're currently viewing this conversation, add the message immediately
              if (
                currentConversation &&
                payload.new?.conversation_id === currentConversation.id
              ) {
                setMessages((prev) => [...prev, payload.new]);
              }

              // Update unread count for this conversation
              // Only show unread if conversation is not currently open
              const isCurrentlyViewing =
                currentConversation &&
                currentConversation.id === payload.new.conversation_id;

              if (!isCurrentlyViewing) {
                const lastReadTime =
                  lastReadTimestamps[payload.new.conversation_id];
                if (!lastReadTime || payload.new.created_at > lastReadTime) {
                  setUnreadCounts((prev) => ({
                    ...prev,
                    [payload.new.conversation_id]:
                      (prev[payload.new.conversation_id] || 0) + 1,
                  }));
                }
              }

              // Reload conversations to update last message (but don't wait for it)
              loadConversations();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        (payload) => {
          console.log("Conversation update:", payload);
          loadConversations();
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

  const renderConversationsList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Messages</h3>
          <button
            onClick={() => setCurrentView("search")}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Users size={20} />
          </button>
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={48} className="mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to get started</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setCurrentConversation(conv);
                loadMessages(conv.id);
                setCurrentView("chat");
                // Mark messages as read
                const currentTime = new Date().toISOString();
                setLastReadTimestamps((prev) => ({
                  ...prev,
                  [conv.id]: currentTime,
                }));
                setUnreadCounts((prev) => ({
                  ...prev,
                  [conv.id]: 0,
                }));
              }}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {conv.otherParticipant?.name?.charAt(0)?.toUpperCase() ||
                      "?"}
                  </div>
                  {unreadCounts[conv.id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCounts[conv.id] > 9 ? "9+" : unreadCounts[conv.id]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-medium truncate ${
                        unreadCounts[conv.id] > 0
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
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSearchView = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={() => setCurrentView("conversations")}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
          <h3 className="text-lg font-semibold text-gray-800">New Chat</h3>
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchResults.map((user) => (
          <div
            key={`${user.type}-${user.id}`}
            onClick={() => startConversation(user)}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
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
          </div>
        ))}
        {searchQuery && searchResults.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView("conversations")}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {currentConversation?.otherParticipant?.name
              ?.charAt(0)
              ?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {currentConversation?.otherParticipant?.name || "Unknown User"}
            </h4>
            <p className="text-xs text-gray-500 capitalize">
              {currentConversation?.otherParticipant?.type || "User"}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Delete this conversation?")) {
                deleteConversation(currentConversation.id);
              }
            }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage =
              message.sender_id === currentUser.id &&
              message.sender_type === currentUser.type;
            return (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
                    isOwnMessage
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
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
                      <p className="text-sm">{message.message_text}</p>
                      {message.is_edited && (
                        <span
                          className={`text-xs ${
                            isOwnMessage ? "text-blue-200" : "text-gray-500"
                          }`}
                        >
                          (edited)
                        </span>
                      )}
                      <div
                        className={`flex items-center justify-between mt-1 ${
                          isOwnMessage ? "text-blue-200" : "text-gray-500"
                        }`}
                      >
                        <span className="text-xs">
                          {formatTime(message.created_at)}
                        </span>
                        {isOwnMessage && !message.isOptimistic && (
                          <CheckCheck size={14} />
                        )}
                        {isOwnMessage && message.isOptimistic && (
                          <Check size={14} />
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
                            className="p-1 text-white hover:bg-blue-600 rounded"
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
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110 flex items-center justify-center z-50"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle size={20} />
              <h2 className="text-lg font-semibold">Institute Chat</h2>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setCurrentView("conversations");
                setCurrentConversation(null);
                setShowMessageOptions(null);
                setMessages([]);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="p-1 hover:bg-blue-600 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {currentView === "conversations" && renderConversationsList()}
            {currentView === "search" && renderSearchView()}
            {currentView === "chat" && renderChatView()}
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Chat;
