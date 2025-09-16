

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#87281B] tracking-tight mb-4">
            About BusMitra
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Your trusted companion for seamless public transportation across India.
          </p>
        </div>

        {/* Introduction Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#87281B] mb-4">
              Our Story
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              BusMitra was created in 2025 by our team Ctrl Alt Defeat at SRMIST. Seeing commuters in small cities struggle with unreliable buses, we built a software only, real-time tracking solution that reduces waiting time, helps authorities plan better, and restores trust in public transport.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#87281B] mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              At BusMitra, our mission is to provide commuters with simple, reliable, and real-time travel information. We strive to cut down waiting, improve daily journeys, and encourage sustainable mobility by making public bus services smarter, accessible, and trustworthy across cities.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#87281B] text-center mb-6">
            Meet Our Team
          </h2>
          {(() => {
            const team = [
              { name: 'Nidhish Rathore', role: 'Full Stack Engineer', image: '/Nidhish.jpg' },
              { name: 'Paras', role: 'ML Engineer', image: '/Paras.jpeg' },
              { name: 'Varad Singhal', role: 'Application Developer', image: '/Varad.jpeg' },
              { name: 'Akshat Soni', role: 'Backend Engineer', image: '/Akshat.jpeg' },
              { name: 'Chaandrayee Dutta', role: 'UI/UX Designer', image: '/Chaandrayee.jpeg' },
              { name: 'Anushka Rakesh', role: 'Researcher', image: '/Anushka.jpeg' },
            ]
            const fallbackSrc = '/logo.png'
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(member => (
                  <div key={member.name} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                    <img
                      src={member.image}
                      alt={member.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackSrc }}
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-2 ring-gray-200"
                      loading="lazy"
                    />
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{member.role}</p>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

     
      </div>
    </div>
  )
}

export default About