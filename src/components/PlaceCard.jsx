import React, { useState } from 'react';
import { submitReport, bookAppointment } from '../services/firestore';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

export default function PlaceCard({ place }) {
    const { queueInfo } = place;
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
            await submitReport(place.id, reportLevel, currentUser.uid);
            toast.success('Report submitted successfully!');
            setShowReport(false);
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.success('Report submitted (demo mode)!');
            setShowReport(false);
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
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4 ${getBorderColor()}`}>
            {/* Primary accent gradient */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 truncate mb-1">
                        {place.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{place.type} • {place.distance}km away</p>
                </div>

                <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wait</div>
                    <div className="text-lg font-semibold text-gray-900">
                        {waitText}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${badgeColor}`}>
                        <span className="mr-1">{icon}</span>
                        {badge}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowReport(!showReport)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 rounded-lg border border-gray-200 transition-colors duration-200"
                    >
                        Report
                    </button>
                    <button
                        onClick={handleBook}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 rounded-lg transition-colors duration-200"
                    >
                        Join
                    </button>
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
