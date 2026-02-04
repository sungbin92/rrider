import { Test, TestingModule } from '@nestjs/testing';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';

describe('RouteController', () => {
  let controller: RouteController;

  const mockRouteService = {
    create: jest.fn(),
    update: jest.fn(),
    findByPlan: jest.fn(),
    calculateFromGraphHopper: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RouteController],
      providers: [{ provide: RouteService, useValue: mockRouteService }],
    }).compile();

    controller = module.get<RouteController>(RouteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('calculate', () => {
    it('should call calculateFromGraphHopper with planId and profile', async () => {
      const planId = 'test-plan-id';
      const dto = { profile: 'bike' as const };
      const mockResult = { distance: 50000, duration: 7200 };

      mockRouteService.calculateFromGraphHopper.mockResolvedValue(mockResult);

      const result = await controller.calculate(planId, dto);

      expect(result).toEqual(mockResult);
      expect(mockRouteService.calculateFromGraphHopper).toHaveBeenCalledWith(planId, 'bike');
    });
  });
});
