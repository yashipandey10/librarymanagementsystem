import './Footer.scss';

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Library Management System. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
