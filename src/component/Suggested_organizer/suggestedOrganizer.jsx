import React, { useState, useEffect } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../../pages/auth/AuthContext';
import { showToast } from '../ToastAlert';

function ImageWithLoader({ src, alt, fallbackSeed, size = 45 }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const fallbackAvatar = `https://picsum.photos/seed/${fallbackSeed}/${size}`;

  return (
    <div className="position-relative" style={{ width: size, height: size }}>
      <img
        src={error ? fallbackAvatar : src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-circle"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        style={{
          objectFit: 'cover',
          display: loaded ? 'block' : 'none',
        }}
      />
    </div>
  );
}

function SingleOrganizers() {
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/organisers`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch organizers');
        }
        const data = await response.json();
        console.log('Response___', data);
        
        // Safely handle potential undefined organisers
        if (data && Array.isArray(data.organisers)) {
          // Add "following" property to each organizer
          const organizersWithFollowState = data.organisers.map(org => ({
            ...org,
            following: org.following || false // default false if not provided
          }));
          setOrganizers(data.organisers);
        } else {
          console.warn('No organisers data received');
          setOrganizers([]);
        }
      } catch (err) {
        console.error('Error fetching organizers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizers();
  }, [token]);

  const [followLoading, setFollowLoading] = useState({}); // Track loading per organizer

  const toggleFollow = async (organizerId) => {
    setFollowLoading((prev) => ({ ...prev, [organizerId]: true }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/follow/${organizerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) {
        throw new Error('Failed to toggle follow');
      }
      const result = await res.json();
      // Show alert from API message
      console.log(result.message);
      showToast.info(result.message);
      // Update follow state instantly
      setOrganizers(prev =>
        prev.map(org =>
          org.id === organizerId
            ? { ...org, following: result.following }
            : org
        )
      );

    } catch (err) {
      console.error('Error toggling follow:', err);
      showError('Something went wrong. Please try again.');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [organizerId]: false }));
    }
  };


  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="grow" variant="primary" />
        <p className="mt-2">Loading Organizers</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-center text-danger">
        <p>Error loading organizers: {error}</p>
      </div>
    );
  }
  return (
    <div className="box shadow-s rounded bg-white mb-3">
      <div className="box-title border-bottom p-3">
        <h6 className="m-0 text-dark"><Link to={'/organizers'}>All Organizers</Link></h6>
      </div>
      <div className="box-body p-3">
        {organizers.map((organizer) => {
          const fullName = `${organizer.organiser} `;
          const username = organizer.email ||
            `${organizer.organiser?.toLowerCase()}`;
          const fallbackSeed = `${fullName}${organizer.id}`;
          const profileImage = organizer.profileUrl?.url ||
            `https://randomuser.me/api/portraits/${organizer.id % 2 === 0 ? 'men' : 'women'}/${organizer.id % 50}.jpg`;

          return (
            <div className="d-flex align-items-center osahan-post-header mb-3 people-list" key={organizer.id}>
              <div className="dropdown-list-image mr-3 position-relative">
                <ImageWithLoader
                  src={profileImage}
                  alt={fullName}
                  fallbackSeed={fallbackSeed}
                  size={80}
                />
              </div>
              <div className="font-weight-bold mr-2">
                <p className="text-truncate m-0">{fullName}</p>
                <span className="small text-gray-500">@{username}</span>
                {organizer.phoneNumber && (
                  <span className="d-block small text-gray-500">{organizer.phoneNumber}</span>
                )}
              </div>
              <span className="ml-auto">
                <button
                  type="button"
                  style={{ background: organizer.following ? '#050505' : '#e5e4e2', color: organizer.following ? 'white' : '#050505' }}
                  className="btn btn-sm d-flex align-items-center border-0"
                  onClick={() => toggleFollow(organizer.id)}
                  disabled={followLoading[organizer.id]}
                >
                  {followLoading[organizer.id] ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <span>{organizer.following ? 'Unfollow' : 'Follow'}</span>{' '}
                      <i className={organizer.following ? 'feather-user-check' : 'feather-user-plus'}></i>
                    </>
                  )}
                </button>

              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SingleOrganizers;
