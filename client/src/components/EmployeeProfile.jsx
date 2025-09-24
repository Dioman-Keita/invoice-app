import { useNavigate } from 'react-router-dom';

function EmployeeProfile({ name = 'Mon profil', photoSrc = 'client/public/image-coton-1.jpg', userName = 'user003^#&7' }) {
    const navigate = useNavigate();

	const handleProfileClick = () => {
		navigate('/profile');
	};

	return (
		<>
			<div className="employee-profile-container">
				<div className="employee-profile" onClick={handleProfileClick}>
					<img className="employee-avatar" src={photoSrc} alt={name} />
					<span className="employee-name">{name}</span>
				</div>
			</div>
		</>
	);
}

export default EmployeeProfile;


