import React from 'react';
import { FiCheck, FiX, FiClock, FiUser, FiTrendingUp } from 'react-icons/fi';

// AI Status Analysis utility
const analyzeReviewStatuses = (reviewers, reviewHistory) => {
  const totalReviewers = reviewers.length;
  const completedReviews = reviewers.filter(reviewer => {
    const reviews = Object.entries(reviewHistory)
      .filter(([_, review]) => review.reviewer === reviewer.email);
    return reviews.length > 0 && reviews[0][1].status !== 'pending';
  }).length;

  const approvalRate = reviewers.filter(reviewer => {
    const reviews = Object.entries(reviewHistory)
      .filter(([_, review]) => review.reviewer === reviewer.email);
    return reviews.length > 0 && reviews[0][1].status === 'approved';
  }).length / totalReviewers * 100;

  return {
    progress: `${completedReviews}/${totalReviewers} reviews completed`,
    approvalRate: `${Math.round(approvalRate)}% approval rate`,
    status: completedReviews === totalReviewers ? 'Complete' : 'In Progress'
  };
};

const ReviewerStatus = ({ email, status }) => {
  const statusConfig = {
    approved: {
      icon: FiCheck,
      text: 'Approved',
      className: 'text-green-400'
    },
    rejected: {
      icon: FiX,
      text: 'Rejected',
      className: 'text-red-400'
    },
    pending: {
      icon: FiClock,
      text: 'Pending',
      className: 'text-yellow-400'
    }
  };

  const config = statusConfig[status || 'pending'];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center">
        <FiUser className="w-4 h-4 text-slate-500 mr-2" />
        <span className="text-slate-300">{email}</span>
      </div>
      <div className={`flex items-center ${config.className}`}>
        <Icon className="w-4 h-4 mr-1" />
        <span className="text-sm">{config.text}</span>
      </div>
    </div>
  );
};

const ReviewStatusSection = ({ project }) => {
  const reviewers = project?.users?.filter(u => u.role === 'reviewer') || [];
  const reviewHistory = project?.reviewHistory || {};

  // Get the latest review status for each reviewer
  const reviewerStatuses = reviewers.map(reviewer => {
    const reviews = Object.entries(reviewHistory)
      .filter(([_, review]) => review.reviewer === reviewer.email)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));

    return {
      email: reviewer.email,
      status: reviews[0]?.[1]?.status || 'pending'
    };
  });

  // Generate AI insights
  const aiInsights = analyzeReviewStatuses(reviewers, reviewHistory);

  if (reviewers.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4">
      <h3 className="text-white font-medium mb-3">Review Status</h3>

      {/* AI Insights Section */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
        <div className="flex items-center text-blue-400 mb-2">
          <FiTrendingUp className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">AI Insights</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-300">{aiInsights.progress}</p>
          <p className="text-sm text-slate-300">{aiInsights.approvalRate}</p>
          <p className="text-sm text-slate-300">Status: {aiInsights.status}</p>
        </div>
      </div>

      <div className="divide-y divide-slate-700">
        {reviewerStatuses.map(reviewer => (
          <ReviewerStatus
            key={reviewer.email}
            email={reviewer.email}
            status={reviewer.status}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewStatusSection; 