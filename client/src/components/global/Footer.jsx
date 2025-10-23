function Footer({dev_name = "@niagnouma corporation"}) {
    return (
        <footer className="w-full bg-white/80 backdrop-blur-md text-gray-700 py-4 px-6 shadow-inner mt-10">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-sm">
                <p>&copy; {new Date().toISOString().split('-')[0]} CMDT - Direction Générale</p>
                <p>Développé par {dev_name}</p>
            </div>
        </footer>
    )
}

export default Footer;