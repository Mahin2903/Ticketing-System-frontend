/* eslint-disable no-unused-vars */
import { Link } from "react-router";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Submit a ticket", to: "/dashboard" },
  { label: "My tickets", to: "/dashboard/user-dashboard-history" },
  { label: "Track status", to: "/dashboard/user-dashboard-history" },
  
];

const DEPT_LINKS = [
  { label: "ICT Support", to: "#" },
  { label: "Network & Wi-Fi", to: "#" },
  { label: "Email & Accounts", to: "#" },
  { label: "Lab & Hardware", to: "#" },
  { label: "Software Requests", to: "#" },
];

const UNI_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Use", to: "/terms" },
  { label: "JUST Official", to: "https://just.edu.bd", external: true },
];

const FooterLinkGroup = ({ label, links }) => (
  <div className="flex flex-col">
    <h3 className="text-[22px] font-normal text-white mb-6 tracking-tight">
      {label}
    </h3>
    <nav className="flex flex-col gap-2.5">
      {links.map(({ label, to, external }) =>
        external ? (
          <a
            key={label}
            href={to}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-zinc-400 hover:text-white transition-colors duration-150 font-normal"
          >
            {label}
          </a>
        ) : (
          <Link
            key={label}
            to={to}
            className="text-[14px] text-zinc-400 hover:text-white transition-colors duration-150 font-normal"
          >
            {label}
          </Link>
        )
      )}
    </nav>
  </div>
);

const Footer = () => {
  return (
    <footer className="bg-black text-white w-full overflow-hidden font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        
        {/* Left Column: Navigation & Info Links */}
        <div className="lg:col-span-6 p-10 md:p-16 flex flex-col justify-between">
          
          {/* Top Links Grid */}
          <div className="grid grid-cols-2 gap-12 mb-16">
            <FooterLinkGroup label="Site index" links={NAV_LINKS} />
            <FooterLinkGroup label="Legal" links={UNI_LINKS} />
          </div>

          {/* Bottom Contact & Brand Info */}
          <div className="grid grid-cols-2 gap-12 pt-6">
            <div>
              <h3 className="text-[22px] font-normal text-white mb-4 tracking-tight">
                Get in touch
              </h3>
              <div className="space-y-1.5 text-[14px] text-zinc-400">
                <p>
                  <a href="mailto:ictcell@just.edu.bd" className="hover:text-white transition-colors">
                    ictcell@just.edu.bd
                  </a>
                </p>
                <p>+880 24777 74200</p>
                <p className="text-zinc-500 pt-1">
                  Jashore University of Science &amp; Technology, Jashore-7408
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-normal tracking-tight text-white">
                  JUST ICT
                </span>
                {/* Dotted indicator icon */}
                <span className="inline-block w-2.5 h-2.5 rounded-full border border-zinc-400 border-dashed animate-spin" />
              </div>
              <p className="text-[12px] text-zinc-500 mt-2">
                © {new Date().getFullYear()} — ICT Cell
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Imagery with Clipped Paper Note */}
        <div className="lg:col-span-6 relative min-h-[400px] lg:min-h-full">
          {/* Background Campus Image */}
          <img
            src="https://i.ibb.co.com/4gfBPM9L/783486605-1401953905466377-4448534645506057128-n.jpg"
            alt="JUST Campus"
            className="w-full h-full object-cover object-center"
          />

          {/* Clipped Sticky Note Overlay */}
          <div className="absolute top-8 left-8 md:top-12 md:left-12 z-10 max-w-[260px] sm:max-w-[300px]">
            {/* Metal Binder Clip Graphic */}
            <div className="absolute -top-5 left-12 z-20 flex flex-col items-center">
              {/* Wire Loop */}
              <div className="w-6 h-7 border-2 border-zinc-300 rounded-t-md border-b-0 -mb-1" />
              {/* Clip Body */}
              <div className="w-10 h-4 bg-zinc-900 border border-zinc-700 rounded-sm shadow-md" />
            </div>

            {/* Paper Note */}
            <div className="bg-[#fcfbf9] text-zinc-900 p-6 pt-8 rounded-sm shadow-2xl border border-zinc-200/80 transform -rotate-1 transition-transform hover:rotate-0 duration-300">
              <div className="flex justify-between items-start text-[10px] font-mono tracking-wider text-zinc-500 uppercase mb-4">
                <span>A NOTE FROM ICT CELL</span>
                <span>JUST ⚙</span>
              </div>

              {/* Note Lines & Content */}
              <div className="space-y-3 font-mono text-[12px] text-zinc-700 leading-relaxed border-t border-b border-zinc-200 py-4 my-2">
                <p>Providing 24/7 technical assistance and infrastructure support across campus.</p>
                <p>Submit a ticket anytime for fast response.</p>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-2 uppercase">
                <span>ST / CTF</span>
                <span>THANK YOU</span>
                <span>JUST</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;