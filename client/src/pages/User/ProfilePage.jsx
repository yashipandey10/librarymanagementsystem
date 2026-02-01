import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/common';
import { CurrentBorrows } from '../../components/borrow';
import './ProfilePage.scss';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateProfile(formData);
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setEditing(false);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || ''
    });
    setEditing(false);
    setMessage(null);
  };

  return (
    <div className="profile-page">
      <h1 className="profile-page__title">My Profile</h1>

      <div className="profile-page__content">
        <Card className="profile-card" hover={false}>
          <h2>Account Information</h2>
          {message && (
            <div className={`profile-card__message profile-card__message--${message.type}`}>
              {message.text}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSubmit}>
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              <div className="profile-card__actions">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-card__info">
                <div className="profile-card__field">
                  <label>Email</label>
                  <p>{user?.email}</p>
                </div>
                <div className="profile-card__field">
                  <label>Name</label>
                  <p>{user?.firstName} {user?.lastName}</p>
                </div>
                <div className="profile-card__field">
                  <label>Phone</label>
                  <p>{user?.phone || 'Not provided'}</p>
                </div>
                <div className="profile-card__field">
                  <label>Currently Borrowed</label>
                  <p>{user?.currentlyBorrowed} / 5 books</p>
                </div>
              </div>
              <Button onClick={() => setEditing(true)}>Edit Profile</Button>
            </>
          )}
        </Card>

        <Card className="profile-card" hover={false}>
          <h2>Current Borrows</h2>
          <CurrentBorrows />
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
