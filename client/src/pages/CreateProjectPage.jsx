import React from 'react';
import CreateProject from '../components/CreateProject';
import SEOMetadata from '../components/SEOMetadata';

const CreateProjectPage = () => {
  return (
    <>
      <SEOMetadata 
        title="Create New Project - FeedbackFlow"
        description="Create a new project and upload your design files for feedback"
      />
      <CreateProject />
    </>
  );
};

export default CreateProjectPage;
