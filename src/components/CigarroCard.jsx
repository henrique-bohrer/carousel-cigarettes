import React from 'react';
import TcgCard from './TcgCard.jsx';

const CigarroCard = ({ cigarro, variant = 'normal', ...rest }) => {
  return <TcgCard card={cigarro} variant={variant} {...rest} />;
};

export default CigarroCard;
