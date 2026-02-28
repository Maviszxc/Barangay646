import React from "react";
import styled from "styled-components";

const Card = () => {
  return (
    <StyledWrapper>
      <div className="cards">
        <figure className="card">
        </figure>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .cards {
    perspective: 500px;
  }

  .card {
    width: 200px;
    height: 250px;
    background: no-repeat center center;
    background-size: cover;
    background-image: url("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjDGMp734S91sDuUFqL51_xRTXS15iiRoHew&s");
    border: 2px solid gray-dark;
    border-radius: 4px;
    position: relative;
    transform-style: preserve-3d;
    will-change: transform;
    transition: transform 0.5s;
  }

  .card:hover {
    transform: translateZ(10px) rotateX(20deg) rotateY(20deg);
  }

  .card_title {
    color: #fff;
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    transition: transform 0.5s;
    font: 700 1.5rem monospace;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
      1px 1px 0 #000;
  }

  .card:hover .card_title {
    transform: translateZ(50px);
  }
`;

export default Card;
