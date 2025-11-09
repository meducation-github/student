import PropTypes from "prop-types";

export default function PageHeader({
  title,
  subtitle,
  setIsMinimized,
  isMinimized,
}) {
  return (
    <div className="max-w-screen-3xl  mx-auto px-4 md:px-4 border-b border-gray-300">
      <div className="items-center justify-between py-4 md:flex">
        <div className="max-w-4xl ">
          <h3
            className="text-gray-800 inline-block text-2xl font-bold cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {title}
          </h3>
          <p className="text-gray-600 inline-block ml-5 text-sm">{subtitle}</p>
        </div>
        {/* <div className="">
          <button
            onClick={func}
            className="block px-4 py-2 text-center text-gray duration-150 font-medium bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400 md:text-sm cursor-pointer"
          >
            Create Data +
          </button>
        </div> */}
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node.isRequired,
  func: PropTypes.node.isRequired,
};
