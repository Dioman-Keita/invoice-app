import { useState } from 'react';
import UserProfilePanel from './UserProfilePanel';

function EmployeeProfile({ name = 'Mon profil', photoSrc = 'client/public/image-coton-1.jpg', userName = 'user003^#&7' }) {
	const [isPanelOpen, setIsPanelOpen] = useState(false);

	const handleProfileClick = () => {
		setIsPanelOpen(true);
	};

	const handleClosePanel = () => {
		setIsPanelOpen(false);
	};

	return (
		<>
			<div className="employee-profile-container">
				<div className="employee-profile" onClick={handleProfileClick}>
					<img className="employee-avatar" src={photoSrc} alt={name} />
					<span className="employee-name">{name}</span>
				</div>
			</div>

			<UserProfilePanel 
				isOpen={isPanelOpen}
				onClose={handleClosePanel}
				userName={userName}
				userPhoto={photoSrc}
			/>
		</>
	);
}

export default EmployeeProfile;


