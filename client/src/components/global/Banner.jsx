import '../../css/Banner.css';
import Header from './Header.jsx';

function Banner() {
    return (
        <header className='cmdt-banner'>
            <Header />
            <div className='gradient-fade'>
                <h2 className='text'>SAISIE DES FACTURES<br />FOURNISSEURS</h2>
            </div>
        </header>
    )
}

export default Banner;