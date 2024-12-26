// client/src/components/common/Logo.jsx
const Logo = () => {
    return (
      <div className="flex items-center gap-2">
        <svg
          className="w-8 h-8 text-accent"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.5 20.5L5.3994 19.8229C5.78386 19.72 6.19121 19.7791 6.54753 19.9565C7.88837 20.6244 9.40034 21 11 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 12H8.01M12 12H12.01M16 12H16.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xl font-bold text-dark">FeedbackFlow</span>
      </div>
    );
  };
  
  export default Logo;
  