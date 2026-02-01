import { useState } from 'react';
import { Button, Input, Card } from '../../components/common';
import './ContactPage.scss';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the message to a server
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  return (
    <div className="contact-page">
      <h1 className="contact-page__title">Contact Us</h1>

      <Card className="contact-card" hover={false}>
        {submitted ? (
          <div className="contact-success">
            <h2>Thank you for your message!</h2>
            <p>We'll get back to you as soon as possible.</p>
            <Button onClick={() => {
              setSubmitted(false);
              setFormData({ name: '', email: '', subject: '', message: '' });
            }}>
              Send Another Message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Your Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
            <div className="contact-card__field">
              <label>Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                required
                placeholder="How can we help you?"
              />
            </div>
            <Button type="submit" fullWidth>Send Message</Button>
          </form>
        )}
      </Card>

      <div className="contact-info">
        <Card hover={false}>
          <h3>Library Hours</h3>
          <p>Monday - Friday: 9:00 AM - 8:00 PM</p>
          <p>Saturday: 10:00 AM - 6:00 PM</p>
          <p>Sunday: Closed</p>
        </Card>
        <Card hover={false}>
          <h3>Contact Information</h3>
          <p>Email: library@example.com</p>
          <p>Phone: +1 234 567 8900</p>
          <p>Address: 123 Library Street, City</p>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;
