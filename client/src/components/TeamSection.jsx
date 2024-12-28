import React from 'react';
import { FiUser, FiEdit2, FiEye } from 'react-icons/fi';

const getRoleIcon = (role) => {
    switch (role?.toUpperCase()) {
        case 'OWNER':
            return <FiUser className="w-4 h-4 text-primary" />;
        case 'EDITOR':
            return <FiEdit2 className="w-4 h-4 text-primary" />;
        case 'VIEWER':
            return <FiEye className="w-4 h-4 text-primary" />;
        default:
            return <FiEye className="w-4 h-4 text-primary" />;
    }
};

const getRoleText = (role) => {
    switch (role?.toUpperCase()) {
        case 'OWNER':
            return 'Owner';
        case 'EDITOR':
            return 'Editor';
        case 'VIEWER':
            return 'Viewer';
        default:
            return 'Viewer';
    }
};

const TeamSection = ({ members = [] }) => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-secondary-foreground">Team Members</h2>
            <div className="space-y-2">
                {members.length === 0 ? (
                    <p className="text-muted-foreground">No team members yet.</p>
                ) : (
                    members.map((member, index) => (
                        <div
                            key={member.email + index}
                            className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    {member.displayName?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-secondary-foreground">
                                        {member.displayName || member.email.split('@')[0]}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                {getRoleIcon(member.role)}
                                <span>{getRoleText(member.role)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeamSection; 