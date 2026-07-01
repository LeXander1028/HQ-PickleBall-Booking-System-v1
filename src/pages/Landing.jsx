import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { VENUE_INFO } from '../lib/constants';
import { MapPin, ShoppingCart, User } from 'lucide-react';

import logo from '../assets/hqPickleCircleFrame.png';
import heroBg from '../assets/pickleball_hero_bg_1782910335868.png';
import action1 from '../assets/action_shot_1_1782910345957.png';
import action2 from '../assets/action_shot_2_1782910363076.png';
import action3 from '../assets/action_shot_3_1782910388149.png';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen text-[#f3f4f6] font-sans bg-[#013220]">


      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex items-center bg-[#013220]">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Pickleball Court" className="w-full h-full object-cover opacity-30 object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#013220] via-[#013220]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#013220] to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 pt-20">
            <span className="text-[#345F4B] font-bold uppercase tracking-[0.2em] text-sm">PREMIUM COURT RENTALS & FACILITIES</span>
            <h1 className="font-display font-black text-6xl md:text-8xl text-white uppercase leading-[0.9] tracking-tighter">
              ELEVATE<br />YOUR GAME
            </h1>
            <p className="text-[#8B9F8E] max-w-md text-lg mt-4 leading-relaxed font-medium">
              From competitive matches to casual play, HQ Pickleball Cebu is designed for athletes who demand more durability, comfort, and precision.
            </p>
            <div className="mt-8">
              <Link
                to={user ? "/book" : "/login"}
                className="inline-block px-10 py-4 bg-[#8B9F8E] text-[#013220] font-bold uppercase tracking-widest text-sm hover:bg-[#345F4B] hover:text-white transition-colors shadow-lg"
              >
                BOOK A COURT
              </Link>
            </div>
          </div>

          <div className="hidden md:flex justify-end pt-20">
            <div className="bg-[#fdfaf5] p-6 rounded shadow-2xl w-72 flex flex-col items-center rotate-2 hover:rotate-0 transition-transform duration-500">
              <h3 className="font-display font-bold text-[#013220] uppercase text-sm w-full text-center mb-4 pb-2 border-b-2 border-[#1F4838]">PROMO RATE</h3>
              <div className="w-32 h-32 flex items-center justify-center bg-[#013220]/5 rounded-full mb-6">
                <span className="text-4xl">☀️</span>
              </div>
              <span className="text-sm font-bold text-[#345F4B] uppercase tracking-wider mb-2">Mon - Thurs Promo</span>
              <span className="text-2xl font-bold text-[#013220]">₱300 <span className="text-sm text-gray-500">/hr/pax</span></span>
              <span className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wider">6:00 AM - 12:00 NN</span>
            </div>
          </div>
        </div>
      </section>

      {/* Built Beyond Refuse Average Section */}
      <section id="features" className="bg-[#fdfaf5] py-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display font-black text-6xl text-[#345F4B] uppercase leading-[0.9] tracking-tighter mb-8">
              BUILT WITH<br />PASSION
            </h2>
            <p className="text-[#0B3B2E] text-lg max-w-md font-medium uppercase tracking-wide leading-relaxed">
              HQ Pickleball was created for people who demand more time to play and systematic approach to book courts.
            </p>

            <div className="mt-12 overflow-hidden aspect-[4/3] rounded shadow-xl">
              <img src={action1} alt="Player Action" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="col-span-1 row-span-2 overflow-hidden rounded shadow-xl aspect-[2/3]">
              <img src={action2} alt="Paddle Action" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="col-span-1 row-span-1 overflow-hidden rounded shadow-xl">
              <img src={action3} alt="Court Detail" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="col-span-1 row-span-1 bg-[#1F4838] flex flex-col justify-end p-6 rounded shadow-xl text-white">
              <h3 className="font-display font-bold uppercase text-xl mb-2">Premium Courts</h3>
              <p className="text-xs text-[#8B9F8E] uppercase tracking-wider">9 Covered Courts by 2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Picks For Champions - Rates Grid */}
      <section id="rates" className="bg-[#0B3B2E] py-24 px-8 border-t-8 border-[#345F4B]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-display font-black text-5xl text-white uppercase leading-[0.9] tracking-tighter">
              COURT RATES &<br />PACKAGES
            </h2>
            <Link to={user ? "/book" : "/login"} className="px-6 py-2 bg-[#8B9F8E] text-[#013220] text-xs font-bold uppercase tracking-wider hover:bg-[#fdfaf5] transition-colors">
              VIEW ALL AVAILABILITY
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Standard Rate */}
            <div className="bg-[#fdfaf5] p-6 rounded shadow flex flex-col items-center border-t-4 border-[#1F4838]">
              <h3 className="font-display font-bold text-[#013220] uppercase text-sm w-full text-center mb-6 pb-2 border-b-2 border-[#1F4838]">Standard Rate</h3>
              <div className="flex-grow flex items-center justify-center text-4xl mb-6 text-[#1F4838]">🎾</div>
              <span className="text-sm font-bold text-[#345F4B] uppercase tracking-wider mb-2 text-center">Anytime 24/7</span>
              <span className="text-xl font-bold text-[#013220]">₱600 <span className="text-sm text-gray-500">/hr</span></span>
              <span className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wider mb-6">Per Court (Max 4 pax)</span>
              <Link to={user ? "/book" : "/login"} className="w-full py-3 bg-[#013220] text-white text-xs font-bold uppercase text-center tracking-widest hover:bg-[#1F4838] transition-colors">
                RESERVE
              </Link>
            </div>

            {/* Promo Rate */}
            <div className="bg-[#fdfaf5] p-6 rounded shadow flex flex-col items-center border-t-4 border-[#345F4B]">
              <h3 className="font-display font-bold text-[#013220] uppercase text-sm w-full text-center mb-6 pb-2 border-b-2 border-[#345F4B]">Morning Promo</h3>
              <div className="flex-grow flex items-center justify-center text-4xl mb-6 text-[#345F4B]">☀️</div>
              <span className="text-sm font-bold text-[#345F4B] uppercase tracking-wider mb-2 text-center">Mon - Thurs</span>
              <span className="text-xl font-bold text-[#013220]">₱300 <span className="text-sm text-gray-500">/hr/pax</span></span>
              <span className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wider mb-6">6:00 AM - 12:00 NN</span>
              <Link to={user ? "/book" : "/login"} className="w-full py-3 bg-[#013220] text-white text-xs font-bold uppercase text-center tracking-widest hover:bg-[#1F4838] transition-colors">
                RESERVE
              </Link>
            </div>

            {/* Pro Shop Placeholder */}
            <div className="bg-[#fdfaf5] p-6 rounded shadow flex flex-col items-center border-t-4 border-[#8B9F8E]">
              <h3 className="font-display font-bold text-[#013220] uppercase text-sm w-full text-center mb-6 pb-2 border-b-2 border-[#8B9F8E]">Pro Shop Rentals</h3>
              <div className="flex-grow flex items-center justify-center text-4xl mb-6 text-[#8B9F8E]">🎾</div>
              <span className="text-sm font-bold text-[#345F4B] uppercase tracking-wider mb-2 text-center">Paddle Rentals</span>
              <span className="text-xl font-bold text-[#013220]">Available</span>
              <span className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wider mb-6">Premium gear on site</span>
              <button className="w-full py-3 bg-[#8B9F8E] text-[#013220] text-xs font-bold uppercase text-center tracking-widest hover:bg-[#345F4B] hover:text-white transition-colors cursor-default">
                AT RECEPTION
              </button>
            </div>

            {/* Coaching */}
            <div className="bg-[#fdfaf5] p-6 rounded shadow flex flex-col items-center border-t-4 border-[#1F4838]">
              <h3 className="font-display font-bold text-[#013220] uppercase text-sm w-full text-center mb-6 pb-2 border-b-2 border-[#1F4838]">Pro Coaching</h3>
              <div className="flex-grow flex items-center justify-center text-4xl mb-6 text-[#1F4838]">🏆</div>
              <span className="text-sm font-bold text-[#345F4B] uppercase tracking-wider mb-2 text-center">Certified Trainers</span>
              <span className="text-xl font-bold text-[#013220]">Inquire</span>
              <span className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wider mb-6">Up to 30 players</span>
              <a href="#location" className="w-full py-3 bg-[#013220] text-white text-xs font-bold uppercase text-center tracking-widest hover:bg-[#1F4838] transition-colors">
                CONTACT US
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Engineered For Performance Banner */}
      <section className="bg-[#fdfaf5] py-24 relative overflow-hidden flex items-center justify-center border-b-8 border-[#345F4B]">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
          <span className="font-display font-black text-[20vw] text-[#013220] whitespace-nowrap">HQ SPORT</span>
        </div>

        <div className="relative z-10 bg-[#345F4B] text-[#fdfaf5] p-12 max-w-md text-center shadow-2xl rotate-2">
          <div className="w-8 h-8 border-2 border-[#fdfaf5] flex items-center justify-center mb-6 mx-auto">
            <span className="font-bold">⚡</span>
          </div>
          <h2 className="font-display font-black text-3xl uppercase tracking-tighter mb-4">ENGINEERED FOR EXCELLENCE</h2>
          <p className="text-xs uppercase tracking-widest font-bold text-[#8B9F8E]">Built with precision. HQ Pickleball delivers power, control, and lasting durability for every player.</p>
        </div>
      </section>

      {/* Explore Collection (Location & Details) */}
      <section id="location" className="bg-[#013220] py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-black text-5xl text-white uppercase leading-[0.9] tracking-tighter mb-12">
            VISIT OUR<br />CENTER
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#0B3B2E] p-8 rounded border border-[#1F4838] flex flex-col justify-center">
              <h3 className="font-display font-bold text-3xl text-white uppercase mb-4">Grand Convention Center</h3>
              <p className="text-[#8B9F8E] text-lg max-w-lg mb-8 leading-relaxed">
                Located in the heart of Cebu's central business district at Archbishop Reyes Ave. Convenient parking space and easy drop-in access before or after office hours.
              </p>
              <div className="flex items-center gap-4 text-[#8B9F8E] font-medium mb-8">
                <MapPin size={24} className="text-[#345F4B]" />
                <span>{VENUE_INFO.address}</span>
              </div>
              <div>
                <a
                  href={VENUE_INFO.contact.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-8 py-3 bg-[#345F4B] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#8B9F8E] hover:text-[#013220] transition-colors"
                >
                  OPEN GOOGLE MAPS
                </a>
              </div>
            </div>

            <div className="bg-[#fdfaf5] rounded p-8 flex flex-col border-t-4 border-[#345F4B]">
              <h3 className="font-display font-bold text-[#013220] uppercase text-xl mb-6">Facility Features</h3>
              <ul className="flex flex-col gap-4 text-sm font-bold text-[#1F4838] uppercase tracking-wider">
                <li className="flex items-center gap-3 border-b border-[#013220]/10 pb-4">
                  <div className="w-8 h-8 bg-[#345F4B]/10 flex items-center justify-center rounded text-[#345F4B]">✓</div>
                  Open 24/7
                </li>
                <li className="flex items-center gap-3 border-b border-[#013220]/10 pb-4">
                  <div className="w-8 h-8 bg-[#345F4B]/10 flex items-center justify-center rounded text-[#345F4B]">✓</div>
                  3 Outdoor Courts
                </li>
                <li className="flex items-center gap-3 border-b border-[#013220]/10 pb-4">
                  <div className="w-8 h-8 bg-[#345F4B]/10 flex items-center justify-center rounded text-[#345F4B]">✓</div>
                  Pro Shop & Rentals
                </li>
                <li className="flex items-center gap-3 border-b border-[#013220]/10 pb-4">
                  <div className="w-8 h-8 bg-[#345F4B]/10 flex items-center justify-center rounded text-[#345F4B]">✓</div>
                  Ample Parking
                </li>
                <li className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 bg-[#345F4B] flex items-center justify-center rounded text-white text-xs">🚀</div>
                  <span className="text-[#345F4B]">9 Covered Courts Mar 2026</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
