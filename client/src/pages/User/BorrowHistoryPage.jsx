import { BorrowHistory } from '../../components/borrow';
import './UserPages.scss';

const BorrowHistoryPage = () => {
  return (
    <div className="user-page">
      <h1 className="user-page__title">My Borrow History</h1>
      <BorrowHistory />
    </div>
  );
};

export default BorrowHistoryPage;
