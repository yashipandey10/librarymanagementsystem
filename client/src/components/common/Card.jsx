import './Card.css';

const Card = ({
  children,
  className = '',
  hover = true,
  padding = 'medium',
  ...props
}) => {
  return (
    <div
      className={`card card--padding-${padding} ${hover ? 'card--hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
