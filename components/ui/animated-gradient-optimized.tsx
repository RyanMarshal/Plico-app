'use client'

import { memo } from 'react'

const AnimatedGradient = memo(function AnimatedGradient() {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div 
          className="animated-gradient-rotate absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgb(168, 85, 247) 0%, transparent 50%), 
                         radial-gradient(circle at 50% 50%, rgb(59, 130, 246) 0%, transparent 50%), 
                         radial-gradient(circle at 50% 50%, rgb(236, 72, 153) 0%, transparent 50%)`,
            filter: 'blur(40px)',
            opacity: 0.7,
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50" />
        
        <div className="animated-gradient-mesh absolute -inset-[10px] opacity-30 overflow-hidden">
          <div 
            className="animated-gradient-translate absolute inset-0"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundSize: '60px 60px',
              width: '200%',
              height: '200%',
            }}
          />
        </div>
      </div>
      
      <div className="fixed inset-0 -z-10 bg-white/80 backdrop-blur-sm" />
      
      <style jsx>{`
        @keyframes gradient-rotate {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        
        @keyframes gradient-translate {
          0% { transform: translateX(0%) translateY(0%); }
          100% { transform: translateX(50%) translateY(50%); }
        }
        
        .animated-gradient-rotate {
          animation: gradient-rotate 20s linear infinite;
          will-change: transform;
        }
        
        .animated-gradient-translate {
          animation: gradient-translate 20s linear infinite alternate;
          will-change: transform;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animated-gradient-rotate,
          .animated-gradient-translate {
            animation: none;
          }
        }
      `}</style>
    </>
  )
})

export default AnimatedGradient