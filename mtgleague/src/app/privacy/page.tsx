'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, Eye, EyeOff, Trash2, UserX } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Privacy Statement</span>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span>Privacy Statement</span>
              </CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                MtgLeague is committed to protecting your privacy and ensuring transparency in how we handle your personal data. 
                This privacy statement explains how we collect, use, and protect your information when you participate in Magic: 
                The Gathering tournaments and events through our platform.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle>What Data We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <UserX className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Player Information</h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    We collect only the minimal information necessary for tournament participation:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Player name (as provided by the tournament organizer)</li>
                    <li>Tournament results and standings</li>
                    <li>No email addresses, phone numbers, or other personal contact information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Your data is used exclusively for:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Displaying tournament standings and results</li>
                <li>Calculating player statistics and rankings</li>
                <li>Managing tournament brackets and matchups</li>
                <li>Providing tournament organizers with necessary information</li>
              </ul>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 font-semibold">
                  We will never sell, rent, or share your personal data with third parties for marketing or commercial purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span>Privacy Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <EyeOff className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Public Visibility</h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    By default, player names are visible to the public to allow friends and family to view tournament results. 
                    However, if you prefer to remain anonymous:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Contact your tournament organizer to request "private" visibility</li>
                    <li>Your name will be displayed as "Anonymous" in public standings</li>
                    <li>Tournament organizers can still see your full name for administrative purposes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Deletion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-blue-600" />
                <span>Right to Deletion</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Under GDPR Article 17 (Right to Erasure), you have the right to request deletion of your personal data. 
                To exercise this right:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Contact your tournament organizer to request data deletion</li>
                <li>Provide your name and the tournaments you participated in</li>
                <li>We will remove your data within 30 days of the request</li>
                <li>Note: Historical tournament results may be affected if your data is removed</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                We retain your data only for as long as necessary:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Active tournament data: Until the tournament is completed</li>
                <li>Historical results: Indefinitely (unless deletion is requested)</li>
                <li>Inactive accounts: Data may be archived after 2 years of inactivity</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                If you have any questions about this privacy statement or wish to exercise your data rights, 
                please contact your tournament organizer or the store administrator. They can assist you with:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Changing your privacy settings</li>
                <li>Requesting data deletion</li>
                <li>Accessing your tournament data</li>
                <li>Reporting privacy concerns</li>
              </ul>
            </CardContent>
          </Card>

          {/* Back to Home Button */}
          <div className="text-center">
            <Button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
} 