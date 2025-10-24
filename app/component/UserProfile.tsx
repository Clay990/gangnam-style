
import React from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> {/* Slightly smaller for button */}
        <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.96C17.72 15.63 17.06 16.8 16.09 17.46V20.01H19.78C21.56 18.33 22.56 15.49 22.56 12.25Z" fill="#4285F4"/>
        <path d="M12 23C15.14 23 17.84 21.94 19.78 20.01L16.09 17.46C15.05 18.1 13.62 18.52 12 18.52C9.08 18.52 6.57 16.63 5.61 14.01H1.84V16.63C3.7 20.48 7.54 23 12 23Z" fill="#34A853"/>
        <path d="M5.61 14.01C5.38 13.34 5.25 12.68 5.25 12C5.25 11.32 5.38 10.66 5.61 9.99V7.37H1.84C1.04 8.94 0.5 10.42 0.5 12C0.5 13.58 1.04 15.06 1.84 16.63L5.61 14.01Z" fill="#FBBC05"/>
        <path d="M12 5.48C13.73 5.48 15.22 6.08 16.41 7.21L20.07 3.55C17.84 1.48 15.14 0 12 0C7.54 0 3.7 2.52 1.84 6.37L5.61 8.99C6.57 6.37 9.08 5.48 12 5.48Z" fill="#EA4335"/>
    </svg>
);

interface UserProfileProps {
  user: User | null;
  handleLogout: () => void;
  handleGoogleSignIn: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, handleLogout, handleGoogleSignIn }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-full overflow-hidden border-2 border-red-600 hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <Image
            src={user?.photoURL || "https://placehold.co/40x40/1f2937/FFF?text=PFP"}
            alt="User Profile"
            width={40}
            height={40}
            className="object-cover"
            unoptimized={!user?.photoURL}
            onError={(e) => (e.currentTarget.src = "https://placehold.co/40x40/1f2937/FFF?text=ERR")}
            priority={!!user?.photoURL}
          />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg py-1 ring-1 ring-gray-700 ring-opacity-5 focus:outline-none">
            {user ? (
              <>
                <span className="block px-4 py-2 text-sm text-gray-400 truncate">{user.email}</span>
                <a href="#" onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left">
                  Logout
                </a>
              </>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
