// src/components/ProgressCard.jsx
import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: linear-gradient(90deg, #ff7cf4, #9188fc);
  color: white;
  padding: 20px;
  border-radius: 16px;
  width: 300px;
  position: relative;
  font-family: 'Arial', sans-serif;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  text-transform: uppercase;
`;

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.span`
  font-size: 14px;
`;

const ProgressBar = styled.div`
  background-color: #d3d3d3;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div`
  background-color: #4c3bff;
  height: 100%;
  width: ${({ percentage }) => percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 14px;
  font-weight: bold;
  text-align: right;
  margin-top: 5px;
`;

const ProgressCard = ({ title, current, total } : {
    title: string;
    current: number;
    total: number;
}) => {
  const percentage = (current / total) * 100;

  return (
    <Card>
      <Title>{title}</Title>
      <ProgressContainer>
        <Label>Progresso</Label>
        <ProgressBar>
          <ProgressFill percentage={percentage} />
        </ProgressBar>
        <ProgressText>{`${current}/${total}`}</ProgressText>
      </ProgressContainer>
    </Card>
  );
};

export default ProgressCard;