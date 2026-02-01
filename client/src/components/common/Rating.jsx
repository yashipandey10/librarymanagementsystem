import { FiStar } from 'react-icons/fi';
import './Rating.scss';

const Rating = ({
  value = 0,
  max = 5,
  onChange,
  readonly = false,
  size = 'medium'
}) => {
  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={`rating rating--${size} ${readonly ? 'rating--readonly' : ''}`}>
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;
        const isHalf = !isFilled && starValue - 0.5 <= value;

        return (
          <button
            key={index}
            type="button"
            className={`rating__star ${isFilled ? 'rating__star--filled' : ''} ${isHalf ? 'rating__star--half' : ''}`}
            onClick={() => handleClick(starValue)}
            disabled={readonly}
          >
            <FiStar />
          </button>
        );
      })}
      {value > 0 && (
        <span className="rating__value">{value.toFixed(1)}</span>
      )}
    </div>
  );
};

export default Rating;
