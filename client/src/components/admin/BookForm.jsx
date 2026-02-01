import { useState, useEffect } from 'react';
import { Button, Input } from '../common';
import { booksAPI } from '../../api';
import { getBookImageUrl } from '../../utils/imageUtils';
import './BookForm.css';

const GENRES = [
  'Action & Adventure',
  'Biography',
  'Mystery',
  'Horror',
  'Thriller & Suspense',
  'Historical Fiction',
  'Romance',
  'self-help',
  'folktales',
  'History',
  'True Crime',
  'Religion & Spirituality'
];

const BookForm = ({ book, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    description: '',
    totalCopies: 1
  });
  const [coverImage, setCoverImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        genre: book.genre || '',
        description: book.description || '',
        totalCopies: book.totalCopies || 1
      });
      if (book.coverImage && book.coverImage !== 'default-book-cover.jpg') {
        setPreview(getBookImageUrl(book.coverImage));
      }
    }
  }, [book]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.genre) newErrors.genre = 'Genre is required';
    if (formData.totalCopies < 1) newErrors.totalCopies = 'Must have at least 1 copy';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const data = { ...formData };
      if (coverImage) {
        data.coverImage = coverImage;
      }

      let response;
      if (book) {
        response = await booksAPI.updateBook(book._id, data);
      } else {
        response = await booksAPI.createBook(data);
      }

      if (response.success && onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      {submitError && <div className="book-form__error">{submitError}</div>}

      <div className="book-form__row">
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
        />
        <Input
          label="Author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          error={errors.author}
          required
        />
      </div>

      <div className="book-form__row">
        <Input
          label="ISBN"
          name="isbn"
          value={formData.isbn}
          onChange={handleChange}
          placeholder="Optional"
        />
        <div className="book-form__field">
          <label>Genre *</label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className={errors.genre ? 'error' : ''}
          >
            <option value="">Select genre</option>
            {GENRES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.genre && <span className="error-text">{errors.genre}</span>}
        </div>
      </div>

      <div className="book-form__field">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Book description..."
        />
      </div>

      <div className="book-form__row">
        <Input
          label="Total Copies"
          name="totalCopies"
          type="number"
          min="1"
          value={formData.totalCopies}
          onChange={handleChange}
          error={errors.totalCopies}
          required
        />
        {book && (
          <div className="book-form__field">
            <label>Available Copies</label>
            <div className="book-form__info">
              {book.availableCopies} of {book.totalCopies} copies available
              {book.totalCopies - book.availableCopies > 0 && (
                <span> ({book.totalCopies - book.availableCopies} currently borrowed)</span>
              )}
            </div>
            <small style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
              Note: Available copies will be automatically adjusted when you update total copies.
            </small>
          </div>
        )}
      </div>

      <div className="book-form__row">
        <div className="book-form__field">
          <label>Cover Image {!book && '(Optional)'}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {preview && (
            <img src={preview} alt="Preview" className="book-form__preview" />
          )}
          {book && !coverImage && !preview && book.coverImage && book.coverImage !== 'default-book-cover.jpg' && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>Current image:</p>
              <img 
                src={getBookImageUrl(book.coverImage)}
                alt="Current cover" 
                className="book-form__preview" 
                onError={(e) => e.target.style.display = 'none'}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginTop: 'var(--spacing-xs)' }}>
                Upload a new image to replace it
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="book-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {book ? 'Update Book' : 'Add Book'}
        </Button>
      </div>
    </form>
  );
};

export default BookForm;
