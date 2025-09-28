import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useTitle from '../hooks/useTitle';
import useBackground from '../hooks/useBackground';
import Footer from '../components/Footer';
import Banner from '../components/Banner';
import { useAuth } from '../services/useAuth';

function Home() {
  useTitle('CMDT - Accueil');
  useBackground('bg-home', 'body');
  const { isAuthenticated, user } = useAuth();
  
  const [stats, setStats] = useState([
    { value: 0, target: 200, label: "Producteurs accompagnés", suffix: "k+" },
    { value: 0, target: 600, label: "Production annuelle", suffix: "k tonnes" },
    { value: 0, target: 45, label: "D'expérience dans le coton", suffix: " ans" }
  ]);

  // Animation des compteurs
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats => 
        prevStats.map(stat => ({
          ...stat,
          value: stat.value < stat.target ? Math.min(stat.value + Math.ceil(stat.target / 20), stat.target) : stat.target
        }))
      );
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Redirection
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col  from-green-50 via-white to-amber-50 text-gray-800">
      {/* Navbar latéral déclencheur */}
      <Navbar />

      {/* Header avec bannière */}
      <Banner isConnected={isAuthenticated}/>

      {/* Contenu principal */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Section Présentation */}
        <section className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-4">
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100">
              Depuis 1975
            </span>
          </div>
          <h2 className="text-4xl font-bold mb-6 text-green-800">Bienvenue à la CMDT</h2>
          <p className="text-xl text-gray-900 leading-relaxed">
            La Compagnie Malienne pour le Développement des Textiles accompagne les producteurs de coton, 
            soutient l'agriculture durable et contribue au développement économique du Mali grâce à 
            une expertise de plus de 45 ans dans la filière cotonnière.
          </p>
        </section>

        {/* Statistiques clés avec animation */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="p-8 rounded-2xl shadow-lg bg-white/90 backdrop-blur-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <h3 className="text-4xl font-bold text-green-700 mb-2">
                {stat.value}{stat.suffix}
              </h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Services */}
        <section className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-800 mb-4">Nos Services</h2>
            <p className="text-lg text-gray-900 max-w-2xl mx-auto">
              Découvrez comment nous soutenons la filière cotonnière malienne à travers nos différents services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl shadow-md bg-white/90 backdrop-blur-md border-t-4 border-green-500 transform transition-all duration-300 hover:shadow-xl">
              <div className="text-green-500 text-4xl mb-4">🧾</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Gestion des factures</h3>
              <p className="text-gray-900">Suivi et traitement des factures en toute transparence pour une gestion optimale des transactions.</p>
            </div>
            <div className="p-8 rounded-2xl shadow-md bg-white/90 backdrop-blur-md border-t-4 border-amber-500 transform transition-all duration-300 hover:shadow-xl">
              <div className="text-amber-500 text-4xl mb-4">👨‍🌾</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Accompagnement</h3>
              <p className="text-gray-900">Soutien technique et financier aux producteurs de coton pour améliorer leurs rendements et qualité.</p>
            </div>
            <div className="p-8 rounded-2xl shadow-md bg-white/90 backdrop-blur-md border-t-4 border-blue-500 transform transition-all duration-300 hover:shadow-xl">
              <div className="text-blue-500 text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Commercialisation</h3>
              <p className="text-gray-900">Mise en marché du coton malien sur les marchés nationaux et internationaux avec une traçabilité garantie.</p>
            </div>
          </div>
        </section>

        {/* Actualités */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-green-500 mb-4">Actualités récentes</h2>
            <p className="text-lg text-gray-950">Restez informé des dernières nouvelles de la filière cotonnière</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="p-6 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border-l-4 border-green-500">
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100 mb-3">
                12 Oct 2023
              </span>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Campagne cotonnière 2025</h3>
              <p className="text-gray-800">Lancement officiel de la nouvelle campagne avec un objectif de production renforcé et des mesures d'accompagnement innovantes.</p>
              <button className="mt-4 text-green-600 font-medium hover:text-green-800 transition-colors">
                Lire la suite →
              </button>
            </article>
            <article className="p-6 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border-l-4 border-amber-500">
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-100 mb-3">
                28 Sep 2023
              </span>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Programme de soutien aux producteurs</h3>
              <p className="text-gray-800">Mise en place de nouvelles mesures pour appuyer la résilience des coopératives face aux défis climatiques et économiques.</p>
              <button className="mt-4 text-amber-600 font-medium hover:text-amber-800 transition-colors">
                Lire la suite →
              </button>
            </article>
          </div>
          <div className="text-center mt-10">
            <button className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
              <a href='https://www.cmdt-mali.net/' target='_blank'>Voir toutes les actualités</a>
            </button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-green-600 to-green-800 rounded-3xl p-10 text-center text-white">
          {isAuthenticated ? (
            <>
              <h2 className="text-3xl font-bold mb-4">Heureux de vous compter parmi nous !</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto">
                Bienvenue dans la communauté CMDT. Nous sommes ravis de vous accompagner dans le développement de la filière cotonnière malienne.
              </p>
              <div className="text-6xl mb-4">🌱</div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-4">Rejoignez la communauté CMDT</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto">
                Découvrez comment nous travaillons ensemble pour développer la filière cotonnière malienne
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  className="px-6 py-3 bg-white/90 backdrop-blur-md text-green-700 font-medium rounded-lg hover:bg-white/70 focus:bg-white/80 transition-colors duration-200"
                  onClick={() => navigate('/login')}
                >
                  Se connecter
                </button>

                <button
                  className="px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 focus:bg-white/20 transition-colors duration-200"
                  onClick={() => navigate('/register')}
                >
                  Créer un compte
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;