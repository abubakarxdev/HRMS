import React from "react";

interface FourSquareProps {
  color?: [string, string, string, string];
  size?: number;
}

const styleSheet = `
@keyframes foursquare-dance {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(100%, 0); }
  50% { transform: translate(100%, 100%); }
  75% { transform: translate(0, 100%); }
}

.foursquare-square {
  position: absolute;
  width: 50%;
  height: 50%;
  animation: foursquare-dance 2s infinite ease-in-out;
}
`;

const FourSquare: React.FC<FourSquareProps> = ({
  color = ["#32cd32", "#327fcd", "#cd32cd", "#cd8032"],
  size = 40,
}) => {
  return (
    <>
      <style>{styleSheet}</style>
      <div
        className="relative"
        style={{ width: size, height: size, transform: "rotate(45deg)" }}
        aria-label="Loading..."
      >
        {/* Square 1: Top-left */}
        <div
          className="foursquare-square"
          style={{
            backgroundColor: color[0],
            top: 0,
            left: 0,
            animationDelay: "0s",
          }}
        />
        {/* Square 2: Top-right */}
        <div
          className="foursquare-square"
          style={{
            backgroundColor: color[1],
            top: 0,
            left: "50%",
            animationDelay: "-0.5s",
          }}
        />
        {/* Square 3: Bottom-right */}
        <div
          className="foursquare-square"
          style={{
            backgroundColor: color[2],
            top: "50%",
            left: "50%",
            animationDelay: "-1s",
          }}
        />
        {/* Square 4: Bottom-left */}
        <div
          className="foursquare-square"
          style={{
            backgroundColor: color[3],
            top: "50%",
            left: 0,
            animationDelay: "-1.5s",
          }}
        />
      </div>
    </>
  );
};

export default FourSquare;
