import React from 'react';
import { motion } from 'framer-motion';

// Signature element: an animated route-line stepper used across the
// Find/Offer ride flows to visualise progress from pickup to destination.
export default function RouteStepper({ steps, current }) {
  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{
                scale: i === current ? 1.15 : 1,
                backgroundColor: i <= current ? '#1FAE86' : '#E7E5DD',
              }}
              className="w-3.5 h-3.5 rounded-full"
            />
            <span className={`text-[11px] font-medium ${i <= current ? 'text-route-dark' : 'text-muted'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px mx-2 relative top-[-9px] overflow-hidden">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    i < current
                      ? 'repeating-linear-gradient(90deg,#1FAE86 0 6px,transparent 6px 12px)'
                      : 'repeating-linear-gradient(90deg,#E7E5DD 0 6px,transparent 6px 12px)',
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
