import '../css/Banner.css';
import Header from './Header';
import EmployeeProfile from './EmployeeProfile';

function Banner({ isConnected = true}) {
    return (
        <header className='cmdt-banner'>
            <Header />
            {isConnected && <EmployeeProfile />}
            <div className='gradient-fade'>
                <h2 className='text'>SAISIE DES FACTURES<br />FOURNISSEURS</h2>
            </div>
        </header>
    )
}

export default Banner;