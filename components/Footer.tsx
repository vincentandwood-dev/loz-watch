'use client';

import { useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">About loz.watch</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What is loz.watch?</h3>
                <p>
                  loz.watch is a situational awareness platform for Lake of the Ozarks, Missouri. 
                  It aggregates publicly available information about lake conditions, local news, 
                  traffic incidents, and points of interest to help visitors and locals stay informed.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What loz.watch is not</h3>
                <p>
                  loz.watch is <strong>not</strong> an emergency service, official government source, 
                  or real-time emergency dispatch system. It does not provide emergency response, 
                  medical advice, or official safety alerts.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Sources</h3>
                <p>
                  Information is compiled from publicly available sources including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>NOAA Weather Alerts</li>
                  <li>Lake Expo (local news)</li>
                  <li>City of Lake Ozark announcements</li>
                  <li>OpenStreetMap (traffic data)</li>
                  <li>Ameren Missouri (lake level data)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                <p>
                  For questions or feedback, contact:{' '}
                  <a
                    href="mailto:info@loz.watch"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    info@loz.watch
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Footer() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <footer className="absolute bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p className="text-center sm:text-left">
            Information shown is compiled from publicly available sources for situational awareness only. Not an emergency service.
          </p>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="text-blue-600 hover:text-blue-700 underline whitespace-nowrap"
          >
            About loz.watch
          </button>
        </div>
      </footer>
      
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}


