import {
  BiBrain,
  BiCodeAlt,
  BiData,
  BiPhone,
  BiPhoneCall,
  BiPlug,
  BiUser,
} from "react-icons/bi";
import PropTypes from "prop-types";
import { House } from "lucide-react";

function Icons({ name, style }) {
  var icon = 0;
  switch (name) {
    case "Home":
      icon = <House style={style} />;
      break;

    case "Call Insights":
      icon = <BiPhoneCall style={style} />;
      break;

    case "Data":
      icon = <BiData style={style} />;
      break;

    case "AI Sandbox":
      icon = <BiBrain style={style} />;
      break;

    case "Integration":
      icon = <BiPlug style={style} />;
      break;

    case "AI Studio":
      icon = <BiCodeAlt style={style} />;
      break;

    case "Account":
      icon = <BiUser style={style} />;
      break;

    case "Phone":
      icon = <BiPhone style={style} />;
      break;

    default:
      break;
  }
  return <>{icon}</>;
}

Icons.propTypes = {
  name: PropTypes.string.isRequired,
  style: PropTypes.object,
};

export default Icons;
