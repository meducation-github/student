/**
 * PageHeader component
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display in the header
 * @param {React.ReactNode} props.children - The children elements to display on the right side of the header
 */

import PropTypes from "prop-types";

function PageHeader({ title, children }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 p-4 mb-5">
      <div className="basis-2/4 text-left">
        <h4 className="text-xl md:text-xl font-semibold text-gray dark:text-white">
          {title}
        </h4>
      </div>
      <div className="basis-2/4 text-right bg-gray-100">{children}</div>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default PageHeader;
