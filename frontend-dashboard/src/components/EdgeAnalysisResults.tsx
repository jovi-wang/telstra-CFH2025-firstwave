import { Flame, TrendingUp, Server, Package } from 'lucide-react';
import { staticEdgeAnalysis } from '../utils/staticData';
import { useSystemStatusStore } from '../store/systemStatusStore';

interface EdgeAnalysisResultsProps {
  edgeNodeLocation?: { lat: number; lon: number; name: string } | null;
  edgeDeployment?: {
    deploymentId: string;
    imageId: string;
    zoneName: string;
    status: string;
  } | null;
}

const EdgeAnalysisResults = ({
  edgeNodeLocation,
  edgeDeployment,
}: EdgeAnalysisResultsProps) => {
  const { heatSignatures, fireSpreadPrediction, statistics } =
    staticEdgeAnalysis;

  // Get edge processing state from systemStatusStore
  const edgeProcessing = useSystemStatusStore((state) => state.edgeProcessing);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'extreme':
        return 'text-danger';
      case 'high':
        return 'text-warning';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'extreme':
        return 'text-danger';
      case 'high':
        return 'text-warning';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-success';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className='p-4 h-full overflow-y-auto'>
      <h2 className='text-lg font-semibold mb-4 flex items-center space-x-2'>
        <Flame className='w-5 h-5 text-warning' />
        <span>Edge Node Analysis</span>
      </h2>

      {/* Edge Node Info */}
      {edgeNodeLocation && (
        <div className='mb-4 bg-background p-4 rounded-lg border border-success'>
          <h3 className='text-sm font-semibold mb-3 flex items-center space-x-2'>
            <Server className='w-4 h-4 text-success' />
            <span>Edge Node Discovered</span>
          </h3>
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-400'>Zone Name:</span>
              <span className='font-bold text-success'>
                {edgeNodeLocation.name}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-400'>Location:</span>
              <span className='font-mono text-xs text-gray-300'>
                {edgeNodeLocation.lat.toFixed(4)},{' '}
                {edgeNodeLocation.lon.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edge Deployment Info */}
      {edgeDeployment && (
        <div className='mb-4 bg-background p-4 rounded-lg border border-primary'>
          <h3 className='text-sm font-semibold mb-3 flex items-center space-x-2'>
            <Package className='w-4 h-4 text-primary' />
            <span>Application Deployed</span>
          </h3>
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-400'>Image:</span>
              <span className='font-bold text-primary'>
                {edgeDeployment.imageId}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-400'>Zone:</span>
              <span className='font-mono text-xs'>
                {edgeDeployment.zoneName}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-400'>Status:</span>
              <span className='px-2 py-0.5 bg-gray-800 border border-success text-success rounded-full text-xs font-semibold uppercase'>
                {edgeDeployment.status}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-400'>Deployment ID:</span>
              <span
                className='font-mono text-xs text-gray-400'
                title={edgeDeployment.deploymentId}
              >
                {edgeDeployment.deploymentId}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fire Spread Prediction - Only show when edge processing is active */}
      {edgeDeployment && edgeProcessing && (
        <div className='mb-6 bg-background p-4 rounded-lg border border-warning'>
          <h3 className='text-sm font-semibold mb-3 flex items-center space-x-2'>
            <TrendingUp className='w-4 h-4 text-warning' />
            <span>Fire Spread Prediction</span>
          </h3>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <div className='text-xs text-gray-400 mb-1'>Direction</div>
              <div className='font-bold text-warning uppercase'>
                {fireSpreadPrediction.direction}
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-400 mb-1'>Speed</div>
              <div className='font-bold'>
                {fireSpreadPrediction.speedKmh} km/h
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-400 mb-1'>
                Predicted Area (30 min)
              </div>
              <div className='font-bold'>
                {fireSpreadPrediction.predictedAreaKm2} km²
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-400 mb-1'>Risk Level</div>
              <span
                className={`text-xs font-semibold ${getRiskBadgeColor(
                  fireSpreadPrediction.riskLevel
                )}`}
              >
                {fireSpreadPrediction.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Heat Signatures */}
      {edgeDeployment && (
        <div className='mb-6'>
          <h3 className='text-sm font-semibold mb-3 flex items-center justify-between'>
            <span>Heat Signatures Detected ({heatSignatures.length})</span>
            <span className='text-xs text-gray-400'>Latest 3 shown</span>
          </h3>

          <div className='space-y-2'>
            {heatSignatures.map((signature) => (
              <div
                key={signature.id}
                className='bg-background p-3 rounded hover:bg-opacity-80 cursor-pointer transition-colors'
              >
                <div className='flex items-center justify-between mb-2'>
                  <span
                    className={`font-semibold text-sm ${getIntensityColor(
                      signature.intensity
                    )}`}
                  >
                    {signature.intensity.toUpperCase()} Intensity
                  </span>
                  <span className='text-xs text-gray-500'>
                    Confidence: {(signature.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className='text-xs text-gray-400 font-mono'>
                  {signature.location.lat.toFixed(4)},{' '}
                  {signature.location.lon.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {edgeDeployment && (
        <div className='bg-background p-4 rounded-lg'>
          <h3 className='text-sm font-semibold mb-3'>Analysis Statistics</h3>

          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Total Heat Signatures:</span>
              <span className='font-bold'>
                {statistics.totalHeatSignatures}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Smoke Coverage:</span>
              <span className='font-bold'>
                {statistics.smokeCoveragePercent}%
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Fire Intensity:</span>
              <span
                className={`font-bold ${getIntensityColor(
                  statistics.fireIntensity
                )}`}
              >
                {statistics.fireIntensity.toUpperCase()}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Persons Detected:</span>
              <span
                className={`font-bold ${
                  statistics.personsDetected > 0
                    ? 'text-danger'
                    : 'text-success'
                }`}
              >
                {statistics.personsDetected}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EdgeAnalysisResults;
