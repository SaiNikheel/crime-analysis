'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BuildingOffice2Icon, UserGroupIcon } from '@heroicons/react/24/outline';

const teamMembers = [
  {
    name: 'Bachu Sai Nikheel',
    role: 'Data Scientist',
    photoUrl: '/images/team/nikheel.jpeg',
    bio: 'Nikheel is a seasoned AI/ML Engineer and Data Scientist with a track record of innovation. His idea for integrating Generative AI in Quality Assurance was recognized among the top 15 out of 300 teams globally at Virtusa. He has also been featured in prominent publications like the Economic Times and News18 for his contributions to the field.',
    linkedin: 'https://www.linkedin.com/in/nikheel-gupta/',
  },
  {
    name: 'Ravva Siva Kumar',
    role: 'Data Scientist',
    photoUrl: '/images/team/siva.jpeg',
    bio: 'Siva Kumar is an AI/ML Engineer and Data Scientist with a passion for developing innovative solutions in weather visualization and climate tech. His work has been instrumental in creating interactive maps and tools that aid in cyclone tracking and real-time weather updates.',
    linkedin: 'https://www.linkedin.com/in/sivaravva1993/',
  },
  {
    name: 'Sai Prabhu Reddy Meka',
    role: 'Data Scientist',
    photoUrl: '/images/team/sai prabu.jpeg',
    bio: 'Sai Prabhu is a Senior Software Engineer specializing in Natural Language Processing (NLP), Generative AI, and Retrieval-Augmented Generation (RAG) for real-time applications. He has developed AI-powered platforms like Nouswise, enabling users to extract insights from vast amounts of data efficiently.',
    linkedin: 'https://www.linkedin.com/in/sai-prabhu-reddy-meka-50a36219a/',
  },
  {
    name: 'Prithvi Sripathi',
    role: 'Data Scientist',
    photoUrl: '', // No photo provided, will use a placeholder
    bio: 'Prithvi brings over 7 years of experience in production management and quality assurance. His expertise lies in ensuring the reliability and scalability of data-driven solutions, contributing significantly to the robustness of our news analysis platform.',
    linkedin: 'https://www.linkedin.com/in/prithvi-sripathi-74513910b/',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Company Section */}
        <section className="mb-16 bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center mb-6">
            <BuildingOffice2Icon className="h-10 w-10 text-indigo-600 mr-4" />
            <h1 className="text-4l font-extrabold text-gray-900 tracking-tight">
              About Us
            </h1>
          </div>
          <p className="text-l text-gray-700 mb-4">
            POTIIP (Patterns of Thinking Incubated Inside Product) is a pioneering AI/ML solutions company dedicated to harnessing the power of artificial intelligence to address real-world challenges. Our expertise spans across computer vision, generative AI, and machine learning models, enabling enterprises and government bodies to leverage cutting-edge technology for enhanced decision-making and operational efficiency.
          </p>
          <p className="text-l text-gray-700">
            Our flagship product is a news analysis platform designed to assist by extracting actionable insights from news data. It provides insights by analyzing patterns, identifying high-risk areas, and providing data-driven recommendations, our platform aims to bolster public safety and inform strategic planning.
          </p>
        </section>

        {/* Team Section */}
        <section className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center mb-10">
            <UserGroupIcon className="h-10 w-10 text-indigo-600 mr-4" />
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Meet the Team
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                {member.photoUrl ? (
                  <div className="relative w-32 h-32 rounded-full mb-4 shadow-md overflow-hidden">
                    <Image 
                      src={member.photoUrl} 
                      alt={member.name} 
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full mb-4 bg-gray-300 flex items-center justify-center text-gray-500 text-4xl font-bold shadow-md">
                    {member.name.substring(0, 1)}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-indigo-600 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{member.bio}</p>
                <Link href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors duration-300">
                  View LinkedIn Profile
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-lg text-gray-700">
            Together, our team at POTIIP is committed to delivering AI-driven solutions that empower enterprises by pushing boundaries.
          </p>
        </section>
      </div>
    </div>
  );
} 