function LineChart() {
  return (
    <svg className="w-full h-[200px]" viewBox="0 0 100 40" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#55AB44"
        strokeWidth="2"
        points="0,30 20,10 40,20 60,5 80,15 100,12"
      />
      <polyline
        fill="none"
        stroke="#8884d8"
        strokeWidth="2"
        points="0,25 20,18 40,12 60,22 80,8 100,20"
      />
    </svg>
  )
}

export default LineChart