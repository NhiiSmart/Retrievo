import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useItems } from '../hooks/useItems';
import { useUpload } from '../hooks/useUpload';
import { CATEGORIES } from '../utils/constants';
import { validateItem } from '../utils/validators';
import toast from 'react-hot-toast';

export const PostItem = () => {
  const navigate = useNavigate();
  const { createItem, loading } = useItems();
  const { uploadToS3, uploading } = useUpload();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    date_lost_found: '',
    description: '',
    status: 'lost',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5242880,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    },
    onDropRejected: (rejections) => {
      toast.error(rejections[0].errors[0].message);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateItem(
      formData.title,
      formData.category,
      formData.location,
      formData.description,
      formData.status
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix all errors');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToS3(imageFile);
      }

      const itemData = {
        ...formData,
        image_url: imageUrl,
      };

      await createItem(itemData);
      navigate('/dashboard');
    } catch (err) {
      // Error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Post New Item</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`input-field ${errors.title ? 'border-danger' : ''}`}
            placeholder="What item is this?"
          />
          {errors.title && (
            <p className="text-sm text-danger mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`input-field ${errors.category ? 'border-danger' : ''}`}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-danger mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`input-field ${errors.location ? 'border-danger' : ''}`}
            placeholder="Where was it lost/found?"
          />
          {errors.location && (
            <p className="text-sm text-danger mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Lost/Found
          </label>
          <input
            type="date"
            name="date_lost_found"
            value={formData.date_lost_found}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className={`input-field ${errors.description ? 'border-danger' : ''}`}
            placeholder="Describe the item in detail..."
          />
          {errors.description && (
            <p className="text-sm text-danger mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Status *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="lost"
                checked={formData.status === 'lost'}
                onChange={handleChange}
                className="mr-2"
              />
              Lost
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="found"
                checked={formData.status === 'found'}
                onChange={handleChange}
                className="mr-2"
              />
              Found
            </label>
          </div>
          {errors.status && (
            <p className="text-sm text-danger mt-1">{errors.status}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image
          </label>
          {!imagePreview ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image here, or click to select'}
              </p>
              <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading || loading}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {submitting || uploading ? 'Posting...' : 'Post Item'}
          </button>
        </div>
      </form>
    </div>
  );
};
