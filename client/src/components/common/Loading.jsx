import './Loading.scss';

const Loading = ({ size = 'medium', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="loading-screen">
        <div className={`loading loading--${size}`}>
          <div className="loading__spinner" />
          <p className="loading__text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`loading loading--${size}`}>
      <div className="loading__spinner" />
    </div>
  );
};

export default Loading;
