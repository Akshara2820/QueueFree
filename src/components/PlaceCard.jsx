import React, { useState } from 'react';
import { submitReport, bookAppointment } from '../services/firestore';
import { submitCrowdReport } from '../services/crowdService';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

export default function PlaceCard({ place }) {
      const { queueInfo, crowdData } = place;
     const [showReport, setShowReport] = useState(false);
     const [reportLevel, setReportLevel] = useState('');


    const getDisplayInfo = () => {
        if (queueInfo.type === 'real') {
            return {
                waitText: `${queueInfo.waitTime} min`,
                badge: 'Real-time',
                badgeColor: 'bg-success-50 text-success-700 border border-success-200',
                icon: '⚡'
            };
        } else if (queueInfo.type === 'community') {
            return {
                waitText: queueInfo.waitTime,
                badge: 'Community',
                badgeColor: 'bg-primary-50 text-primary-700 border border-primary-200',
                icon: '👥'
            };
        } else {
            const levelText = queueInfo.crowdLevel || (queueInfo.level === 'high' ? 'High' : queueInfo.level === 'moderate' ? 'Moderate' : 'Low');
            const crowdBadge = levelText ? `${levelText} Crowd` : 'Predicted';
            return {
                waitText: queueInfo.waitTime,
                badge: crowdBadge,
                badgeColor: levelText === 'Low' ? 'bg-success-50 text-success-700 border border-success-200' :
                    levelText === 'Moderate' ? 'bg-warning-50 text-warning-700 border border-warning-200' :
                        'bg-danger-50 text-danger-700 border border-danger-200',
                icon: '🔮'
            };
        }
    };

    const { waitText, badge, badgeColor, icon } = getDisplayInfo();

    // Get border color based on crowd level
    const getBorderColor = () => {
        if (queueInfo.type === 'real') return 'border-l-green-500';
        if (queueInfo.type === 'community') return 'border-l-blue-500';
        // For prediction type
        const level = queueInfo.crowdLevel || queueInfo.level;
        if (level === 'Low' || level === 'low') return 'border-l-green-500';
        if (level === 'Moderate' || level === 'moderate') return 'border-l-yellow-500';
        if (level === 'High' || level === 'high') return 'border-l-red-500';
        return 'border-l-gray-300';
    };

    const handleReport = async () => {
        const mockUser = localStorage.getItem('mockUser');
        const currentUser = auth.currentUser || (mockUser ? JSON.parse(mockUser) : null);
        if (!currentUser) {
            toast.error('Please login to report crowd level');
            return;
        }
        if (!reportLevel) return;
        try {
            // Convert report level to the format expected by crowd service
            const crowdLevelMap = {
                'low': 'low',
                'medium': 'moderate',
                'high': 'high'
            };

            await submitCrowdReport(place.id, currentUser.uid, crowdLevelMap[reportLevel] || reportLevel);
            toast.success('Crowd report submitted successfully!');
            setShowReport(false);
            setReportLevel('');
        } catch (error) {
            console.error('Error submitting crowd report:', error);
            toast.error('Failed to submit crowd report. Please try again.');
        }
    };

    const handleBook = async () => {
        const mockUser = localStorage.getItem('mockUser');
        const currentUser = auth.currentUser || (mockUser ? JSON.parse(mockUser) : null);
        if (!currentUser) {
            toast.error('Please login to book an appointment');
            return;
        }
        const time = prompt('Enter appointment time (e.g., 2023-12-01 10:00)');
        if (!time) return;
        try {
            await bookAppointment(place.id, currentUser.uid, time);
            toast.success('Appointment booked successfully!');
        } catch (error) {
            console.error('Error booking:', error);
            toast.success('Appointment booked (demo mode)!');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden group">
            {/* Card Header with subtle background */}
            <div className="p-4 pb-3">
                {/* Place Name and Type */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                            {place.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                            {place.type}
                        </p>
                        {place.address && place.address !== 'Address not available' && (
                            <p
                                className="text-xs text-gray-500 truncate mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => {
                                    const { lat, lng } = place.location;
                                    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                                    window.open(mapsUrl, '_blank');
                                }}
                                title="Click to open in Google Maps"
                            >
                                📍 {place.address}
                            </p>
                        )}
                    </div>

                    {/* Distance Badge */}
                    <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            📍 {place.distance}km
                        </span>
                    </div>
                </div>

                {/* Rating and Status Row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Rating */}
                        {place.rating > 0 && (
                            <div className="flex items-center gap-1">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`text-sm ${star <= Math.floor(place.rating) ? 'text-yellow-400' : star - 0.5 <= place.rating ? 'text-yellow-200' : 'text-gray-300'}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500 ml-1">{place.rating}</span>
                            </div>
                        )}

                        {/* Status & Hours in one line */}
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                                place.business_status === 'OPERATIONAL'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {place.business_status === 'OPERATIONAL' ? '🟢 Open' : '🔴 Closed'}
                            </span>

                            {/* Show hours only if meaningful (not static fallbacks) */}
                            {place.opening_hours &&
                             place.opening_hours !== 'Hours not specified' &&
                             place.opening_hours !== 'Hours available' &&
                             !place.opening_hours.includes('Typically') &&
                             place.opening_hours !== '24/7' && (
                                <span className="text-xs text-gray-600">
                                    🕐 {place.opening_hours}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Wait Time */}
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Wait Time</div>
                        <div className="text-sm font-semibold text-gray-900">
                            {place.business_status === 'OPERATIONAL' ? waitText : '-'}
                        </div>
                    </div>
                </div>

                {/* Description */}
                {place.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {place.description}
                    </p>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                    {/* Show crowd badges for open places, closed status for closed places */}
                    {place.business_status === 'OPERATIONAL' ? (
                        crowdData ? (
                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm ${
                                crowdData.color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' :
                                crowdData.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                crowdData.color === 'orange' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                <span className="mr-1.5">{crowdData.emoji}</span>
                                {crowdData.level} Crowd
                            </span>
                        ) : (
                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${badgeColor} shadow-sm`}>
                                <span className="mr-1.5">{icon}</span>
                                {badge}
                            </span>
                        )
                    ) : (
                        /* Closed places show closed badge */
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 border border-gray-200 shadow-sm">
                            <span className="mr-1.5">⏰</span>
                            Closed
                        </span>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReport(!showReport)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm"
                        >
                            Report
                        </button>
                        <button
                            onClick={handleBook}
                            className="px-4 py-1.5 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 rounded-lg transition-all duration-200 hover:shadow-sm"
                        >
                            Join Queue
                        </button>
                    </div>
                </div>
            </div>

            {/* Report modal */}
            {showReport && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-3">Report crowd level:</p>
                    <div className="flex gap-2 mb-3">
                        {[
                            { level: 'low', emoji: '🟢', label: 'Low' },
                            { level: 'medium', emoji: '🟡', label: 'Moderate' },
                            { level: 'high', emoji: '🔴', label: 'High' }
                        ].map(({ level, emoji, label }) => (
                            <button
                                key={level}
                                onClick={() => setReportLevel(level)}
                                className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${reportLevel === level
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    }`}
                            >
                                <span className="mr-1">{emoji}</span>
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleReport}
                        className="w-full px-3 py-2 rounded-md bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors duration-200"
                    >
                        Submit Report
                    </button>
                </div>
            )}
        </div>
    );
}
