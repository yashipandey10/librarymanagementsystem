import { FiBook, FiUsers, FiBookOpen, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { Card } from '../common';
import './DashboardStats.scss';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      icon: <FiBook />,
      label: 'Total Books',
      value: stats.totalBooks,
      color: 'primary'
    },
    {
      icon: <FiUsers />,
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'secondary'
    },
    {
      icon: <FiBookOpen />,
      label: 'Active Borrows',
      value: stats.activeBorrows,
      color: 'info'
    },
    {
      icon: <FiAlertTriangle />,
      label: 'Overdue',
      value: stats.overdueBorrows,
      color: 'warning'
    },
    {
      icon: <FiDollarSign />,
      label: 'Unpaid Fines',
      value: `Rs. ${stats.totalUnpaidFines}`,
      color: 'danger'
    }
  ];

  return (
    <div className="dashboard-stats">
      {statCards.map((stat, index) => (
        <Card key={index} className={`stat-card stat-card--${stat.color}`} hover={false}>
          <div className="stat-card__icon">{stat.icon}</div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stat.value}</span>
            <span className="stat-card__label">{stat.label}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
