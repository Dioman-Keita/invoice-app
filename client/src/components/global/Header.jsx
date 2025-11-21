import '../../css/Header.css';

function Header() {
    return (
        <div className="cmdt-header">
            <img src="../../public/cmdt_icone.png" alt="cmdt-logo" className='cmdt-logo'/>
            <div className='cmdt-title'>
                <h1>C.M.D.T <br /></h1><h2>DIRECTION GENERALE</h2>
            </div>
        </div>
    )
}

export default Header;
