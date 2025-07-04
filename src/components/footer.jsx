const Footer = () => {
  return (
    <footer className="text-gray-400 bg-gray-900 body-font">
      <div className="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
        <a href="#" className="flex title-font font-medium items-center text-white mb-4 md:mb-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="w-10 h-10 text-white p-2 bg-indigo-500 rounded-full"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>

          <span className="ml-3 text-xl">Baires Essence</span>
        </a>
        <p className="text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-800 sm:py-2 sm:mt-0 mt-4">
          © 2025 Baires Essence
        </p>
        <span className="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
          <a href="#" className="text-gray-400">
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </a>
          <a href="#" className="ml-3 text-gray-400">
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </a>
          <a href="#" className="ml-3 text-gray-400">
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01" />
            </svg>
          </a>
          <a
            href="https://wa.me/tu-numero"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 text-gray-400 hover:text-gray-600"
            aria-label="WhatsApp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 32 32"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M24.503906 7.503906C22.246094 5.246094 19.246094 4 16.050781 4C9.464844 4 4.101563 9.359375 4.101563 15.945313C4.097656 18.050781 4.648438 20.105469 5.695313 21.917969L4 28.109375L10.335938 26.445313C12.078125 27.398438 14.046875 27.898438 16.046875 27.902344L16.050781 27.902344C22.636719 27.902344 27.996094 22.542969 28 15.953125C28 12.761719 26.757813 9.761719 24.503906 7.503906ZM16.050781 25.882813L16.046875 25.882813C14.265625 25.882813 12.515625 25.402344 10.992188 24.5L10.628906 24.285156L6.867188 25.269531L7.871094 21.605469L7.636719 21.230469C6.640625 19.648438 6.117188 17.820313 6.117188 15.945313C6.117188 10.472656 10.574219 6.019531 16.054688 6.019531C18.707031 6.019531 21.199219 7.054688 23.074219 8.929688C24.949219 10.808594 25.980469 13.300781 25.980469 15.953125C25.980469 21.429688 21.523438 25.882813 16.050781 25.882813ZM21.496094 18.445313C21.199219 18.296875 19.730469 17.574219 19.457031 17.476563C19.183594 17.375 18.984375 17.328125 18.785156 17.625C18.585938 17.925781 18.015625 18.597656 17.839844 18.796875C17.667969 18.992188 17.492188 19.019531 17.195313 18.871094C16.894531 18.722656 15.933594 18.40625 14.792969 17.386719C13.90625 16.597656 13.304688 15.617188 13.132813 15.320313C12.957031 15.019531 13.113281 14.859375 13.261719 14.710938C13.398438 14.578125 13.5625 14.363281 13.710938 14.1875C13.859375 14.015625 13.910156 13.890625 14.011719 13.691406C14.109375 13.492188 14.058594 13.316406 13.984375 13.167969C13.910156 13.019531 13.3125 11.546875 13.0625 10.949219C12.820313 10.367188 12.574219 10.449219 12.390625 10.4375C12.21875 10.429688 12.019531 10.429688 11.820313 10.429688C11.621094 10.429688 11.296875 10.503906 11.023438 10.804688C10.75 11.101563 9.980469 11.824219 9.980469 13.292969C9.980469 14.761719 11.050781 16.183594 11.199219 16.382813C11.347656 16.578125 13.304688 19.59375 16.300781 20.886719C17.011719 21.195313 17.566406 21.378906 18 21.515625C18.714844 21.742188 19.367188 21.710938 19.882813 21.636719C20.457031 21.550781 21.648438 20.914063 21.898438 20.214844C22.144531 19.519531 22.144531 18.921875 22.070313 18.796875C21.996094 18.671875 21.796875 18.597656 21.496094 18.445313Z"
              />
            </svg>
          </a>

        </span>
      </div>
    </footer>
  )
}

export default Footer
