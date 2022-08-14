import React from 'react';

import './styles/ProfileShared.scss';

export function ProfileManagementBlock({caption, children}) {
    return <div className="profile_management_block">
        <div className="profile_management_block__caption">{caption}</div>
        <div className="profile_management_block__main">{children}</div>
    </div>
}