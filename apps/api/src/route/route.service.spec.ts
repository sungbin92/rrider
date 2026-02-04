import { Test, TestingModule } from '@nestjs/testing';
import { RouteService } from './route.service';
import { PrismaService } from '../prisma/prisma.service';
import { GraphHopperService } from '../graphhopper/graphhopper.service';

describe('RouteService', () => {
  let service: RouteService;

  const mockPrismaService = {
    client: {
      plan: {
        findUnique: jest.fn(),
      },
      route: {
        create: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    },
  };

  const mockGraphHopperService = {
    calculateRoute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GraphHopperService, useValue: mockGraphHopperService },
      ],
    }).compile();

    service = module.get<RouteService>(RouteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateFromGraphHopper', () => {
    it('should calculate route and save to database', async () => {
      const planId = 'test-plan-id';
      const mockPlan = {
        id: planId,
        startLat: 37.5665,
        startLng: 126.978,
        endLat: 37.4,
        endLng: 127.0,
        waypoints: [],
      };
      const mockCalculatedRoute = {
        distance: 50000,
        duration: 7200,
        polyline: 'encoded_polyline',
        instructions: [],
        snappedWaypoints: [[37.5665, 126.978], [37.4, 127.0]],
      };

      mockPrismaService.client.plan.findUnique.mockResolvedValue(mockPlan);
      mockGraphHopperService.calculateRoute.mockResolvedValue(mockCalculatedRoute);
      mockPrismaService.client.route.upsert.mockResolvedValue({ id: 'route-id', ...mockCalculatedRoute });

      const result = await service.calculateFromGraphHopper(planId);

      expect(result).toEqual(mockCalculatedRoute);
      expect(mockGraphHopperService.calculateRoute).toHaveBeenCalledWith(
        { lat: mockPlan.startLat, lng: mockPlan.startLng },
        { lat: mockPlan.endLat, lng: mockPlan.endLng },
        [],
        'bike',
      );
    });
  });
});
