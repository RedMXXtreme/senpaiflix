import React from "react";
import { Link } from "react-router-dom";

// Reuse SVG icons from Navbar for social media
const DiscordIcon = () => (
  <svg fill="white" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0786-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0815.0095c.1192.099.246.1981.372.2924a.0766.0766 0 01-.0064.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1062c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1824 0-2.1568-1.0857-2.1568-2.419 0-1.3332.9554-2.4189 2.1568-2.4189 1.2109 0 2.1758 1.0952 2.1569 2.419 0 1.3332-.946 2.4189-2.1569 2.4189z" />
  </svg>
);

const RedditIcon = () => (
  <svg fill="white" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385-.113-.965-.213-2.447.043-3.507.234-.965 1.51-6.14 1.51-6.14s-.383-.77-.383-1.91c0-1.79 1.04-3.13 2.33-3.13 1.1 0 1.63.825 1.63 1.81 0 1.1-.7 2.74-1.06 4.27-.3 1.27.64 2.3 1.9 2.3 2.28 0 3.82-2.93 3.82-6.37 0-2.62-1.77-4.58-5.4-4.58-3.9 0-6.33 2.92-6.33 5.94 0 1.18.45 2.45 1.01 3.14.11.13.13.25.1.38-.1.42-.33 1.27-.37 1.44-.06.22-.2.27-.46.16-1.7-.8-2.76-3.27-2.76-5.27 0-4.3 3.13-8.25 9.03-8.25 4.73 0 8.4 3.38 8.4 7.9 0 4.7-2.96 8.48-7.1 8.48-1.39 0-2.7-.72-3.15-1.56l-.85 3.24c-.3 1.13-1.12 2.55-1.67 3.42C9.5 23.9 10.7 24 12 24c6.627 0 12-5.373 12-12z" />
  </svg>
);

const TwitterIcon = () => (
  <svg fill="white" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M23.954 4.569c-.885.39-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.724-.95.555-2.005.959-3.127 1.184-.897-.959-2.178-1.559-3.594-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124-4.083-.205-7.702-2.158-10.126-5.134-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.213 2.188 4.096-.807-.026-1.566-.247-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.318-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.179 1.394 4.768 2.209 7.557 2.209 9.054 0 14-7.496 14-13.986 0-.21 0-.423-.015-.633.962-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-black text-white px-6 py-6 mt-8">
      {/* Top section */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="font-extrabold text-lg select-none whitespace-nowrap">A-Z List</h2>
          <p className="text-gray-500 select-none whitespace-nowrap">Searching anime order by alphabet name A to Z.</p>
          <div className="flex gap-2 flex-wrap">
            <button className="bg-gray-800 rounded px-3 py-1 font-semibold select-none hover:bg-gray-700">All</button>
            <button className="bg-gray-800 rounded px-3 py-1 font-semibold select-none hover:bg-gray-700">0-9</button>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
              <button
                key={char}
                className="bg-gray-800 rounded px-3 py-1 font-semibold select-none hover:bg-gray-700"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-6 whitespace-nowrap font-semibold text-sm select-none">
          <button className="hover:text-pink-500">REQUEST</button>
          <button className="hover:text-pink-500">CONTACT US</button>
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex flex-col gap-1 max-w-md text-sm text-gray-400 select-none">
          <p>Copyright ©SenpaiFlix. All Rights Reserved</p>
          <p>This site does not store any files on its server. All contents are provided by non-affiliated third parties.</p>
          <p>Socials: 
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="inline-block ml-1 hover:text-pink-500">
              <TwitterIcon />
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="inline-block ml-2 hover:text-pink-500">
              <DiscordIcon />
            </a>
            <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="inline-block ml-2 hover:text-pink-500">
              <RedditIcon />
            </a>
          </p>
        </div>
        <div className="flex items-center justify-center flex-grow max-w-xs">
          <img
            src="https://i.pinimg.com/736x/8c/c1/a9/8cc1a9914f50d202cc868c107d828254.jpg"
            alt="SenpaiFlix Logo"
            className="h-10 select-none"
            draggable={false}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
