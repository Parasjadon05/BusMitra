import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Linkedin } from "lucide-react";


const team = [
  { name: 'Nidhish Rathore', role: 'Full Stack Engineer', image: '/Nidhish.jpg', linkedin: 'https://www.linkedin.com/in/nidhish-rathore-b2b9bb325/', email: 'codenidhish07@gmail.com', phone: '+91-8708295706' },
  { name: 'Paras', role: 'ML Engineer', image: '/Paras.jpeg', linkedin: 'https://www.linkedin.com/in/paras05/', email: 'parasjadon05@gmail.com', phone: '+91-7983329477' },
  { name: 'Varad Singhal', role: 'Application Developer', image: '/Varad.jpeg', linkedin: 'https://www.linkedin.com/in/varad-singhal-ba1361326/', email: 'varad@example.com', phone: '+91-7805841826' },
  { name: 'Akshat Soni', role: 'Backend Engineer', image: '/Akshat.jpeg', linkedin: 'https://www.linkedin.com/in/akshat-soni-393a02326/', email: 'akshat@example.com', phone: '+91-7887445091' },
  { name: 'Chaandrayee Dutta', role: 'UI/UX Designer', image: '/Chaandrayee.jpeg', linkedin: 'https://linkedin.com/in/chaandrayee-dutta', email: 'chaandrayee@example.com', phone: '+91-9056570391' },
  { name: 'Anushka Rakesh', role: 'Researcher', image: '/Anushka.jpeg', linkedin: 'https://www.linkedin.com/in/anushka-rakesh-605466324/', email: 'anushka@example.com', phone: '+91-9742524898' },
];

function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 flex flex-col">
      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow">
        {/* Team Section */}
        <section className="mb-20">
          <h2 className="text-5xl font-bold text-center text-gray-800 mb-12 tracking-tight">
            Our Leadership Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {team.map((member, index) => (
              <Card
                key={index}
                className="relative overflow-hidden rounded-xl shadow-md transition-all duration-500 bg-white/30 backdrop-blur-xl border border-gray-200/50 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-gray-200/20 to-transparent opacity-30" />
                <CardHeader className="flex flex-col items-center pt-8">
                  <img
                    src={member.image}
                    alt={`${member.name}'s photo`}
                    className="w-32 h-32 object-cover rounded-full border-4 border-gray-300/50 mb-5 shadow-sm transition-transform duration-300 hover:scale-105"
                  />
                  <CardTitle className="text-2xl font-semibold text-gray-800 tracking-tight">
                    {member.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-medium text-base">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-5 pb-8">
                  <div className="flex justify-center space-x-8">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <Linkedin className="w-8 h-8 text-[#0A66C2] group-hover:text-[#003087] transition-colors duration-300 transform group-hover:scale-110" />
                    </a>
                    <a
                      href={`mailto:${member.email}`}
                      className="group"
                    >
                      <Mail className="w-8 h-8 text-gray-700 group-hover:text-gray-900 transition-colors duration-300 transform group-hover:scale-110" />
                    </a>
                    <a
                      href={`tel:${member.phone}`}
                      className="group"
                    >
                      <Phone className="w-8 h-8 text-gray-700 group-hover:text-gray-900 transition-colors duration-300 transform group-hover:scale-110" />
                    </a>
                  </div>
                  <p className="text-gray-700 text-sm font-medium tracking-wide">
                    <strong>Email:</strong> {member.email}
                  </p>
                  <p className="text-gray-700 text-sm font-medium tracking-wide">
                    <strong>Phone:</strong> {member.phone}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* General Contact Info */}
        <section className="text-center py-16">
          <div className="bg-white/20 backdrop-blur-xl border border-gray-200/30 rounded-2xl p-10 max-w-3xl mx-auto shadow-xl transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-5xl font-bold text-gray-800 mb-6 tracking-tight">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-medium max-w-2xl mx-auto">
              We're here to assist you with any inquiries or support needs. Reach out to us through the following channels.
            </p>
            <div className="space-y-8">
              <p className="text-gray-800 flex items-center justify-center space-x-4 text-lg font-medium">
                <Mail className="w-8 h-8 text-gray-700" />
                <span>busmitraa@gmail.com</span>
              </p>
          
              <Button
                className="bg-gray-800 hover:bg-gray-900 text-white px-10 py-4 mt-8 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 tracking-wide text-lg font-semibold"
                onClick={() => window.location.href = 'mailto:support@busmitra.com'}
              >
                Send a Message
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Contact;