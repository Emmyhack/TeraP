'use client';

import React from 'react';
import { Calendar, User, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: "The Future of Decentralized Mental Health",
      excerpt: "Exploring how blockchain technology can revolutionize access to mental health services worldwide.",
      author: "TeraP Team",
      date: "2025-01-15",
      readTime: "5 min read",
      category: "Technology"
    },
    {
      id: 2,
      title: "Cross-Chain Therapy: Breaking Down Barriers",
      excerpt: "How ZetaChain enables seamless therapy sessions across multiple blockchain networks.",
      author: "Dr. Sarah Johnson",
      date: "2025-01-10",
      readTime: "7 min read",
      category: "Innovation"
    },
    {
      id: 3,
      title: "Privacy-First Wellness: Zero-Knowledge Proofs in Therapy",
      excerpt: "Maintaining complete privacy while accessing mental health services through advanced cryptography.",
      author: "Michael Chen",
      date: "2025-01-05",
      readTime: "6 min read",
      category: "Privacy"
    },
    {
      id: 4,
      title: "Building Supportive Communities with Wellness Circles",
      excerpt: "How decentralized wellness circles create safe spaces for peer support and healing.",
      author: "Dr. Emily Rodriguez",
      date: "2024-12-28",
      readTime: "4 min read",
      category: "Community"
    },
    {
      id: 5,
      title: "Token Economics for Mental Health: The TERAP Model",
      excerpt: "Understanding how tokenized incentives can improve mental health outcomes and accessibility.",
      author: "James Wilson",
      date: "2024-12-20",
      readTime: "8 min read",
      category: "Economics"
    },
    {
      id: 6,
      title: "DAO Governance in Healthcare: A New Paradigm",
      excerpt: "How decentralized governance can democratize healthcare decision-making and policy.",
      author: "TeraP Research",
      date: "2024-12-15",
      readTime: "6 min read",
      category: "Governance"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">TeraP Blog</h1>
          <p className="text-xl text-neutral-600">
            Insights, updates, and thoughts on the future of decentralized wellness
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                  <span className="text-xs text-neutral-500">{post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-semibold text-neutral-800 mb-3 line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-neutral-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button className="mt-4 inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium">
                  <span>Read More</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Stay Updated</h2>
            <p className="text-neutral-600 mb-6">
              Subscribe to our newsletter for the latest updates on decentralized wellness and TeraP platform developments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}