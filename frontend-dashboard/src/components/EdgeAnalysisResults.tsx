import { memo } from 'react';
import { Zap, TrendingUp, Server, Package, AlertTriangle } from 'lucide-react';
import { staticEdgeAnalysis } from '../utils/staticData';
import {
  useSystemStatusStore,
  type EdgeDeployment,
} from '../store/systemStatusStore';

interface EdgeAnalysisResultsProps {
  edgeNodeLocation?: { lat: number; lon: number; name: string } | null;
  edgeDeployment?: EdgeDeployment | null;
}

const EdgeAnalysisResults = ({
  edgeNodeLocation,
  edgeDeployment,
}: EdgeAnalysisResultsProps) => {
  const { damageHotspots, damageSeverityAssessment, statistics } =
    staticEdgeAnalysis;

  // Get edge processing state from systemStatusStore
  const edgeProcessing = useSystemStatusStore((state) => state.edgeProcessing);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-danger';
      case 'severe':
        return 'text-warning';
      case 'moderate':
        return 'text-yellow-400';
      case 'minor':
        return 'text-success';
      default:
        return 'text-gray-400';
    }
  };

  const getDamageTypeLabel = (type: string) => {
    switch (type) {
      case 'downed_line':
        return 'Downed Line';
      case 'damaged_pole':
        return 'Damaged Pole';
      case 'transformer_damage':
        return 'Transformer Damage';
      case 'vegetation':
        return 'Vegetation Contact';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className='p-4 h-full overflow-y-auto'>
      <h2 className='text-lg font-semibold mb-4 flex items-center space-x-2'>
        <Zap className='w-5 h-5 text-warning' />
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

      {/* Damage Severity Assessment */}
      {edgeDeployment && edgeProcessing && (
        <div className='mb-6 bg-background p-4 rounded-lg border border-warning'>
          <h3 className='text-sm font-semibold mb-3 flex items-center space-x-2'>
            <TrendingUp className='w-4 h-4 text-warning' />
            <span>Damage Severity Assessment</span>
          </h3>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <div className='text-xs text-gray-400 mb-1'>
                Affected Direction
              </div>
              <div className='font-bold text-warning uppercase'>
                {damageSeverityAssessment.affectedDirection}
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-400 mb-1'>Spread Rate</div>
              <div className='font-bold'>
                {damageSeverityAssessment.spreadRateKmh} km/h
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-400 mb-1'>Affected Area</div>
              <div className='font-bold'>
                {damageSeverityAssessment.affectedAreaKm2} km²
              </div>
            </div>

            <div>
              <div className='text-xs text-gray-400 mb-1'>Severity Level</div>
              <span
                className={`text-xs font-semibold ${getSeverityColor(
                  damageSeverityAssessment.severityLevel
                )}`}
              >
                {damageSeverityAssessment.severityLevel.toUpperCase()}
              </span>
            </div>

            <div className='col-span-2'>
              <div className='text-xs text-gray-400 mb-1'>Est. Repair Time</div>
              <div className='font-bold text-primary'>
                {damageSeverityAssessment.estimatedRepairTimeHours} hours
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Damage Hotspots */}
      {edgeDeployment && edgeProcessing && (
        <div className='mb-6'>
          <h3 className='text-sm font-semibold mb-3 flex items-center justify-between'>
            <span>Damage Hotspots Detected ({damageHotspots.length})</span>
            <span className='text-xs text-gray-400'>Latest 3 shown</span>
          </h3>

          <div className='space-y-2'>
            {damageHotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                className='bg-background p-3 rounded hover:bg-opacity-80 cursor-pointer transition-colors'
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-2'>
                    <AlertTriangle
                      className={`w-4 h-4 ${getSeverityColor(
                        hotspot.severity
                      )}`}
                    />
                    <span
                      className={`font-semibold text-sm ${getSeverityColor(
                        hotspot.severity
                      )}`}
                    >
                      {hotspot.severity.toUpperCase()}
                    </span>
                  </div>
                  <span className='text-xs text-gray-500'>
                    {(hotspot.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className='text-xs text-primary mb-1'>
                  {getDamageTypeLabel(hotspot.type)}
                </div>

                <div className='text-xs text-gray-400 font-mono'>
                  {hotspot.location.lat.toFixed(4)},{' '}
                  {hotspot.location.lon.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {edgeDeployment && edgeProcessing && (
        <div className='bg-background p-4 rounded-lg'>
          <h3 className='text-sm font-semibold mb-3'>Analysis Statistics</h3>

          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Total Damage Hotspots:</span>
              <span className='font-bold'>
                {statistics.totalDamageHotspots}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Affected Area:</span>
              <span className='font-bold'>
                {statistics.affectedAreaPercent}%
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Damage Severity:</span>
              <span
                className={`font-bold ${getSeverityColor(
                  statistics.damageSeverity
                )}`}
              >
                {statistics.damageSeverity.toUpperCase()}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-400'>Customers Affected:</span>
              <span
                className={`font-bold ${
                  statistics.customersAffected > 0
                    ? 'text-danger'
                    : 'text-success'
                }`}
              >
                {statistics.customersAffected.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(EdgeAnalysisResults);
