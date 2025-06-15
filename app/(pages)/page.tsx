import PollCreator from '@/components/plico/PollCreator'

export default function HomePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Create a Quick Poll
        </h1>
        <p className="text-lg text-gray-600">
          Ask a question, get instant feedback. Simple as that.
        </p>
      </div>
      
      <PollCreator />
    </div>
  )
}