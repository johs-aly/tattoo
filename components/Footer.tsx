import ContactMe from "@/components/ContactMe";
import { siteConfig } from "@/config/site";
import Link from "next/link";

const Footer = () => {
  const d = new Date();
  const currentYear = d.getFullYear();

  return (
      <footer>
        <div className="mt-16 pt-6 pb-2 flex flex-col items-center bg-black text-sm text-gray-400 border-t">
          <div className="mb-2 flex space-x-2">
            <div>{`©${currentYear}`}</div>
            <div>Contact me at: </div>
            <a href="mailto:smithjoh749@gmail.com" className="text-gray-300 hover:text-gray-100">
              smithjoh749@gmail.com
            </a>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
